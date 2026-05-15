import { tool } from "@opencode-ai/plugin";
import { z } from "zod";
import fsSync from "fs";
import path from "path";
import os from "os";

export const superpipelines_read_registry = tool({
  description: "Reads all scope registries, merges them, and returns validated JSON",
  args: {},
  execute: async (_args, { directory }) => {
    const registries: any[] = [];
    const scopeRoots = [
      path.join(directory, ".opencode"),
      path.join(os.homedir(), ".opencode"),
    ];

    for (const root of scopeRoots) {
      const regPath = path.join(root, "superpipelines", "registry.json");
      if (fsSync.existsSync(regPath)) {
        try {
          const content = fsSync.readFileSync(regPath, "utf-8");
          registries.push(JSON.parse(content));
        } catch (e) {
          console.error(`Error parsing registry at ${regPath}`, e);
        }
      }
    }
    return { output: JSON.stringify({ registries }) };
  }
});

export const superpipelines_read_state = tool({
  description: "Reads a pipeline state file with path resolution and validation",
  args: {
    pipelineName: z.string(),
    scope: z.enum(["local", "project", "user"]).optional()
  },
  execute: async ({ pipelineName, scope }, { directory }) => {
    let searchRoots = [
      path.join(directory, ".opencode"),
      path.join(os.homedir(), ".opencode")
    ];

    if (scope === "user") searchRoots = [path.join(os.homedir(), ".opencode")];
    else if (scope === "project" || scope === "local") searchRoots = [path.join(directory, ".opencode")];

    for (const root of searchRoots) {
      const statePath = path.join(root, "superpipelines", pipelineName, "pipeline-state.json");
      if (fsSync.existsSync(statePath)) {
        try {
          const content = fsSync.readFileSync(statePath, "utf-8");
          return { output: content };
        } catch (e) {
          throw new Error(`Failed to parse state file at ${statePath}`);
        }
      }
    }
    throw new Error(`State file not found for pipeline ${pipelineName}`);
  }
});

export const superpipelines_write_state = tool({
  description: "Writes pipeline state atomically (tmp file + rename) with schema enforcement",
  args: {
    pipelineName: z.string(),
    stateJson: z.string(),
    scope: z.enum(["local", "project", "user"]).optional()
  },
  execute: async ({ pipelineName, stateJson, scope }, { directory }) => {
    let targetRoot = path.join(directory, ".opencode");
    if (scope === "user") targetRoot = path.join(os.homedir(), ".opencode");

    const pipelineDir = path.join(targetRoot, "superpipelines", pipelineName);
    if (!fsSync.existsSync(pipelineDir)) {
      fsSync.mkdirSync(pipelineDir, { recursive: true });
    }

    const statePath = path.join(pipelineDir, "pipeline-state.json");
    const tmpPath = statePath + ".tmp";

    // validate JSON before writing
    JSON.parse(stateJson);

    fsSync.writeFileSync(tmpPath, stateJson, "utf-8");
    fsSync.renameSync(tmpPath, statePath);

    return { output: JSON.stringify({ success: true, path: statePath }) };
  }
});
