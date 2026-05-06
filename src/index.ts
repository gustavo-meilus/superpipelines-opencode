import type { Plugin, PluginModule } from "@opencode-ai/plugin";
import type { Message, Part } from "@opencode-ai/sdk";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as yamlParse } from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let _bootstrapCache: string | null | undefined = undefined;
let _resolvedModels: any = null;

function extractFrontmatter(content: string) {
  const normalized = content.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatterStr: match[1], body: match[2].trim() };
}

const serverPlugin: Plugin = async ({ project, directory, worktree }, options) => {
  const pluginRoot = path.resolve(__dirname, "..");
  const skillsDir = path.join(pluginRoot, "skills");
  const agentsDir = path.join(pluginRoot, "agents");

  const getBootstrapContent = () => {
    if (_bootstrapCache !== undefined) return _bootstrapCache;

    const skillPath = path.join(skillsDir, "using-superpipelines", "SKILL.md");
    if (!fsSync.existsSync(skillPath)) {
      _bootstrapCache = null;
      return null;
    }

    const content = fsSync.readFileSync(skillPath, "utf-8");
    
    const modelsDirective = `
**USER MODEL PREFERENCES (CRITICAL INSTRUCTION)**
The user has configured the following model preferences for Superpipelines:
- Default Model: \`${_resolvedModels.default}\`
- Architect Model: \`${_resolvedModels.architect}\`
- Reviewer Model: \`${_resolvedModels.reviewer}\`

Whenever you act as the pipeline-architect to generate new agent definitions (e.g. \`pipeline-spec-reviewer.md\`), you MUST use these corresponding models in their YAML frontmatter instead of any default Anthropic models.
`;

    _bootstrapCache = `<EXTREMELY_IMPORTANT>\nYou have superpipelines.\n\n${modelsDirective}\n\n**Below is the full content of your 'superpipelines:using-superpipelines' skill — your introduction to designing and running AI pipelines.**\n\n${content}\n</EXTREMELY_IMPORTANT>`;
    return _bootstrapCache;
  };

  return {
    config: async (config: any) => {
      // config.agent (singular) is the Opencode Config key for agent definitions
      // config.skills.paths is processed by OpenCode internally
      // neither is exposed in the public SDK Config type yet
      // Plugin options are passed via [plugin, options] tuple in config;
      // fallback to config.superpipelines for backwards compatibility
      const modelOptions = (options as any)?.models;
      _resolvedModels = modelOptions || config.superpipelines?.models || {
        default: "opencode/gemini-3.1-pro",
        architect: "opencode/gemini-3.1-pro",
        reviewer: "opencode/gemini-3-flash"
      };

      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }

      config.agent = config.agent || {};
      if (fsSync.existsSync(agentsDir)) {
        const agentFiles = fsSync.readdirSync(agentsDir).filter((f: string) => f.endsWith(".md"));
        for (const file of agentFiles) {
          const agentName = file.replace(".md", "");
          const content = fsSync.readFileSync(path.join(agentsDir, file), "utf-8");
          const extracted = extractFrontmatter(content);
          
          if (extracted) {
            try {
              const parsed = yamlParse(extracted.frontmatterStr);
              let finalModel = _resolvedModels.default;
              if (agentName.includes("architect")) {
                finalModel = _resolvedModels.architect;
              } else if (agentName.includes("reviewer")) {
                finalModel = _resolvedModels.reviewer;
              }

              const { description, effort, steps, version, permission, ...rest } = parsed;
              const agentConfig: Record<string, unknown> = {
                model: finalModel,
                prompt: extracted.body,
              };
              if (description) agentConfig.description = description;
              if (effort) agentConfig.effort = effort;
              if (steps) agentConfig.maxSteps = steps;
              if (permission) agentConfig.permission = permission;

              config.agent[agentName] = agentConfig;
            } catch (err) {
              console.error(`[superpipelines] Error parsing frontmatter for agent ${agentName}:`, err);
            }
          }
        }
      }
    },

    "experimental.chat.messages.transform": async (_input: {}, output: { messages: { info: Message; parts: Part[] }[] }) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;
      
      const firstUser = output.messages.find((m) => m.info.role === "user");
      if (!firstUser || !firstUser.parts.length) return;

      if (firstUser.parts.some((p) => p.type === "text" && "text" in p && p.text.includes("EXTREMELY_IMPORTANT"))) return;

      firstUser.parts.unshift({ type: "text", text: bootstrap } as any);
    }
  };
};

const SuperPipelines: PluginModule = {
  id: "superpipelines",
  server: serverPlugin,
};

export default SuperPipelines;
export { SuperPipelines };