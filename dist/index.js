// src/index.ts
import fsSync from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { parse as yamlParse } from "yaml";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var _bootstrapCache = void 0;
var _resolvedModels = null;
var _pluginVersion = "0.0.0";
function extractFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatterStr: match[1], body: match[2].trim() };
}
var BUILTIN_COMMANDS = {
  "new-pipeline": "superpipelines:new-pipeline",
  "run-pipeline": "superpipelines:run-pipeline",
  "new-step": "superpipelines:new-step",
  "update-step": "superpipelines:update-step",
  "delete-step": "superpipelines:delete-step",
  "audit-pipeline": "superpipelines:audit-pipeline",
  "init-deep": "superpipelines:init-deep",
  "change-models": "superpipelines:change-models"
};
var serverPlugin = async ({ project, directory, worktree }, options) => {
  const pluginRoot = path.resolve(__dirname, "..");
  const skillsDir = path.join(pluginRoot, "skills");
  const agentsDir = path.join(pluginRoot, "agents");
  try {
    const pkgPath = path.join(pluginRoot, "package.json");
    if (fsSync.existsSync(pkgPath)) {
      const pkg = JSON.parse(fsSync.readFileSync(pkgPath, "utf-8"));
      if (pkg.version) _pluginVersion = pkg.version;
    }
  } catch {
  }
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
    const versionDirective = `
**SUPERPIPELINES PLUGIN VERSION:** \`${_pluginVersion}\`
When creating or modifying pipeline artifacts (topology.json, registry.json, pipeline-state.json, agent frontmatter), you MUST stamp the current plugin version (\`${_pluginVersion}\`) into the \`plugin_version\` field. This enables future retro-compatibility checks.
`;
    _bootstrapCache = `<EXTREMELY_IMPORTANT>
You have superpipelines.

${modelsDirective}
${versionDirective}
**Below is the full content of your 'superpipelines:using-superpipelines' skill \u2014 your introduction to designing and running AI pipelines.**

${content}
</EXTREMELY_IMPORTANT>`;
    return _bootstrapCache;
  };
  return {
    config: async (config) => {
      const modelOptions = options?.models;
      _resolvedModels = modelOptions || config.superpipelines?.models || {
        default: "opencode/big-pickle",
        architect: "opencode/big-pickle",
        reviewer: "opencode/big-pickle"
      };
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
      const scopeRoots = [
        path.join(directory, ".opencode"),
        path.join(os.homedir(), ".opencode")
      ];
      for (const scopeRoot of scopeRoots) {
        const projectSkillsDir = path.join(scopeRoot, "skills");
        if (fsSync.existsSync(projectSkillsDir)) {
          if (!config.skills.paths.includes(projectSkillsDir)) {
            config.skills.paths.push(projectSkillsDir);
          }
        }
      }
      config.agent = config.agent || {};
      const loadAgentFile = (filePath, agentName) => {
        const content = fsSync.readFileSync(filePath, "utf-8");
        const extracted = extractFrontmatter(content);
        if (!extracted) return;
        try {
          const parsed = yamlParse(extracted.frontmatterStr);
          let finalModel;
          if (parsed.model) {
            finalModel = String(parsed.model);
          } else {
            finalModel = _resolvedModels.default;
            if (agentName.includes("architect")) {
              finalModel = _resolvedModels.architect;
            } else if (agentName.includes("reviewer")) {
              finalModel = _resolvedModels.reviewer;
            }
          }
          const { description, effort, steps, version, permission, mode, hidden, ...rest } = parsed;
          const agentConfig = {
            model: finalModel,
            prompt: extracted.body
          };
          if (description) agentConfig.description = description;
          if (effort) agentConfig.effort = effort;
          if (steps) agentConfig.maxSteps = steps;
          if (permission) agentConfig.permission = permission;
          if (mode) agentConfig.mode = mode;
          if (hidden !== void 0) agentConfig.hidden = hidden;
          config.agent[agentName] = agentConfig;
        } catch (err) {
          console.error(`[superpipelines] Error parsing frontmatter for agent ${agentName}:`, err);
        }
      };
      const scanAgentsDir = (dir) => {
        if (!fsSync.existsSync(dir)) return;
        const entries = fsSync.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanAgentsDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(".md")) {
            const agentName = entry.name.replace(".md", "");
            if (config.agent[agentName]) continue;
            loadAgentFile(fullPath, agentName);
          }
        }
      };
      if (fsSync.existsSync(agentsDir)) {
        const agentFiles = fsSync.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
        for (const file of agentFiles) {
          const agentName = file.replace(".md", "");
          loadAgentFile(path.join(agentsDir, file), agentName);
        }
      }
      for (const scopeRoot of scopeRoots) {
        const projectAgentsDir = path.join(scopeRoot, "agents");
        scanAgentsDir(projectAgentsDir);
      }
      config.command = config.command || {};
      const commandsDir = path.join(pluginRoot, "commands");
      if (fsSync.existsSync(commandsDir)) {
        const cmdFiles = fsSync.readdirSync(commandsDir).filter((f) => f.endsWith(".md"));
        for (const file of cmdFiles) {
          const cmdName = file.replace(".md", "");
          const cmdKey = BUILTIN_COMMANDS[cmdName];
          if (!cmdKey) continue;
          if (config.command[cmdKey]) continue;
          const content = fsSync.readFileSync(path.join(commandsDir, file), "utf-8");
          const extracted = extractFrontmatter(content);
          if (!extracted) continue;
          try {
            const parsed = yamlParse(extracted.frontmatterStr);
            const commandConfig = {
              template: extracted.body
            };
            if (parsed.description) commandConfig.description = parsed.description;
            if (parsed.agent) commandConfig.agent = parsed.agent;
            if (parsed.model) commandConfig.model = parsed.model;
            if (parsed.subtask !== void 0) commandConfig.subtask = parsed.subtask;
            if (parsed.argument_hint || parsed["argument-hint"]) {
              commandConfig.argumentHint = parsed.argument_hint || parsed["argument-hint"];
            }
            config.command[cmdKey] = commandConfig;
          } catch (err) {
            console.error(`[superpipelines] Error parsing built-in command ${cmdName}:`, err);
          }
        }
      }
      const reservedDirs = /* @__PURE__ */ new Set(["pipelines", "temp"]);
      for (const scopeRoot of scopeRoots) {
        const spDir = path.join(scopeRoot, "superpipelines");
        if (!fsSync.existsSync(spDir)) continue;
        const entries = fsSync.readdirSync(spDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory() || reservedDirs.has(entry.name)) continue;
          const pipelineName = entry.name;
          const commandFile = path.join(spDir, pipelineName, `${pipelineName}.md`);
          if (!fsSync.existsSync(commandFile)) continue;
          const content = fsSync.readFileSync(commandFile, "utf-8");
          const extracted = extractFrontmatter(content);
          if (!extracted) continue;
          try {
            const parsed = yamlParse(extracted.frontmatterStr);
            const commandKey = `superpipelines:${pipelineName}`;
            if (config.command[commandKey]) continue;
            const commandConfig = {
              template: extracted.body
            };
            if (parsed.description) commandConfig.description = parsed.description;
            if (parsed.agent) commandConfig.agent = parsed.agent;
            if (parsed.model) commandConfig.model = parsed.model;
            if (parsed.subtask !== void 0) commandConfig.subtask = parsed.subtask;
            if (parsed.argument_hint || parsed["argument-hint"]) {
              commandConfig.argumentHint = parsed.argument_hint || parsed["argument-hint"];
            }
            config.command[commandKey] = commandConfig;
          } catch (err) {
            console.error(`[superpipelines] Error parsing command for pipeline ${pipelineName}:`, err);
          }
        }
      }
    },
    "experimental.chat.messages.transform": async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;
      const firstUser = output.messages.find((m) => m.info.role === "user");
      if (!firstUser || !firstUser.parts.length) return;
      if (firstUser.parts.some((p) => p.type === "text" && "text" in p && p.text.includes("EXTREMELY_IMPORTANT"))) return;
      firstUser.parts.unshift({ type: "text", text: bootstrap });
    }
  };
};
var SuperPipelines = {
  id: "superpipelines",
  server: serverPlugin
};
var index_default = SuperPipelines;
export {
  SuperPipelines,
  index_default as default
};
