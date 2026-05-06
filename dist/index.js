// src/index.ts
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as yamlParse } from "yaml";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var _bootstrapCache = void 0;
var _resolvedModels = null;
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatterStr: match[1], body: match[2].trim() };
}
var serverPlugin = async ({ project, client, $, directory, worktree }) => {
  const pluginRoot = path.resolve(__dirname, "..");
  const skillsDir = path.join(pluginRoot, "skills");
  const agentsDir = path.join(pluginRoot, "agents");
  const getBootstrapContent = () => {
    if (_bootstrapCache !== void 0) return _bootstrapCache;
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
    _bootstrapCache = `<EXTREMELY_IMPORTANT>
You have superpipelines.

${modelsDirective}

**Below is the full content of your 'superpipelines:using-superpipelines' skill \u2014 your introduction to designing and running AI pipelines.**

${content}
</EXTREMELY_IMPORTANT>`;
    return _bootstrapCache;
  };
  return {
    // Inject skills paths and dynamically construct/override agents
    config: async (config) => {
      _resolvedModels = config.superpipelines?.models || {
        default: "opencode-zen",
        architect: "opencode-zen",
        reviewer: "opencode-go"
      };
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
      config.agents = config.agents || {};
      if (fsSync.existsSync(agentsDir)) {
        const agentFiles = fsSync.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
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
              config.agents[agentName] = {
                ...parsed,
                model: finalModel,
                system: extracted.body
              };
            } catch (err) {
              console.error(`[superpipelines] Error parsing frontmatter for agent ${agentName}:`, err);
            }
          }
        }
      }
    },
    // Inject bootstrap into the first user message of each session
    "experimental.chat.messages.transform": async (input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;
      const firstUser = output.messages.find((m) => m.info.role === "user");
      if (!firstUser || !firstUser.parts.length) return;
      if (firstUser.parts.some((p) => p.type === "text" && p.text.includes("EXTREMELY_IMPORTANT"))) return;
      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: "text", text: bootstrap });
    },
    "tui.command.execute": async (input, output) => {
      const cmd = input.command.trim();
      if (cmd.startsWith("superpipelines:")) {
        output.handled = true;
        await client.app.log({
          body: {
            service: "superpipelines",
            level: "warn",
            message: `Slash commands (${cmd}) are intercepted. In OpenCode, invoke superpipelines features via natural language, e.g., 'run superpipelines architect to create a new pipeline'.`
          }
        });
      }
    }
  };
};
var pluginModule = {
  id: "superpipelines-opencode",
  server: serverPlugin
};
var index_default = pluginModule;
export {
  index_default as default
};
