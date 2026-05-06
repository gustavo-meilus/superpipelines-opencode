// src/tui.ts
import fsSync from "fs";
import os from "os";
import path from "path";
import { parse as yamlParse } from "yaml";
var RESERVED_DIRS = /* @__PURE__ */ new Set(["pipelines", "temp"]);
function discoverPipelineCommands(projectDir) {
  const commands = [];
  const scopeRoots = [
    path.join(projectDir, ".opencode"),
    path.join(os.homedir(), ".opencode")
  ];
  for (const scopeRoot of scopeRoots) {
    const spDir = path.join(scopeRoot, "superpipelines");
    if (!fsSync.existsSync(spDir)) continue;
    const entries = fsSync.readdirSync(spDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || RESERVED_DIRS.has(entry.name)) continue;
      const pipelineName = entry.name;
      const commandFile = path.join(spDir, pipelineName, `${pipelineName}.md`);
      if (!fsSync.existsSync(commandFile)) continue;
      const content = fsSync.readFileSync(commandFile, "utf-8");
      let description = `Run the ${pipelineName} pipeline`;
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        try {
          const parsed = yamlParse(match[1]);
          if (parsed.description) description = String(parsed.description);
        } catch {
        }
      }
      commands.push({ name: pipelineName, description });
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return commands.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}
var superPipelinesTui = async (api, _options, _meta) => {
  api.command.register(() => {
    const builtins = [
      {
        title: "SuperPipelines: New Pipeline",
        value: "superpipelines:new-pipeline",
        description: "Design a new pipeline workflow",
        category: "SuperPipelines",
        slash: { name: "superpipelines:new-pipeline" }
      },
      {
        title: "SuperPipelines: Run Pipeline",
        value: "superpipelines:run-pipeline",
        description: "Execute an existing pipeline",
        category: "SuperPipelines",
        slash: { name: "superpipelines:run-pipeline" }
      },
      {
        title: "SuperPipelines: Add Step",
        value: "superpipelines:new-step",
        description: "Add a step to an existing pipeline",
        category: "SuperPipelines",
        slash: { name: "superpipelines:new-step" }
      },
      {
        title: "SuperPipelines: Update Step",
        value: "superpipelines:update-step",
        description: "Update an existing pipeline step",
        category: "SuperPipelines",
        slash: { name: "superpipelines:update-step" }
      },
      {
        title: "SuperPipelines: Delete Step",
        value: "superpipelines:delete-step",
        description: "Remove a step from a pipeline",
        category: "SuperPipelines",
        slash: { name: "superpipelines:delete-step" }
      },
      {
        title: "SuperPipelines: Audit Pipeline",
        value: "superpipelines:audit-pipeline",
        description: "Audit pipeline(s) against layout, topology, and safety standards",
        category: "SuperPipelines",
        slash: { name: "superpipelines:audit-pipeline" }
      },
      {
        title: "SuperPipelines: Init Deep Context",
        value: "superpipelines:init-deep",
        description: "Generate hierarchical PIPELINE-CONTEXT.md files across the repo",
        category: "SuperPipelines",
        slash: { name: "superpipelines:init-deep" }
      }
    ];
    const pipelineCommands = discoverPipelineCommands(process.cwd()).map(
      ({ name, description }) => ({
        title: `Run: ${name}`,
        value: `superpipelines:${name}`,
        description,
        category: "SuperPipelines",
        slash: { name: `superpipelines:${name}` }
      })
    );
    return [...builtins, ...pipelineCommands];
  });
  api.event.on("session.idle", () => {
    api.ui.toast({
      message: "SuperPipelines session completed",
      variant: "success"
    });
  });
  api.event.on("session.error", () => {
    api.ui.toast({
      message: "SuperPipelines session encountered an error",
      variant: "error"
    });
  });
};
var SuperPipelinesTui = {
  id: "superpipelines",
  tui: superPipelinesTui
};
var tui_default = SuperPipelinesTui;
export {
  tui_default as default,
  superPipelinesTui
};
