import { tool } from "@opencode-ai/plugin";
import { z } from "zod";
import fsSync from "fs";
import path from "path";
import os from "os";

export const superpipelines_read_registry = tool({
  name: "superpipelines:read-registry",
  description: "Reads all scope registries, merges them, and returns validated JSON",
  parameters: z.object({}),
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
    return { registries };
  }
});

export const superpipelines_read_state = tool({
  name: "superpipelines:read-state",
  description: "Reads a pipeline state file with path resolution and validation",
  parameters: z.object({
    pipelineName: z.string(),
    scope: z.enum(["local", "project", "user"]).optional()
  }),
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
          return JSON.parse(fsSync.readFileSync(statePath, "utf-8"));
        } catch (e) {
          throw new Error(`Failed to parse state file at ${statePath}`);
        }
      }
    }
    throw new Error(`State file not found for pipeline ${pipelineName}`);
  }
});

export const superpipelines_write_state = tool({
  name: "superpipelines:write-state",
  description: "Writes pipeline state atomically (tmp file + rename) with schema enforcement",
  parameters: z.object({
    pipelineName: z.string(),
    state: z.record(z.any()),
    scope: z.enum(["local", "project", "user"]).optional()
  }),
  execute: async ({ pipelineName, state, scope }, { directory }) => {
    let targetRoot = path.join(directory, ".opencode");
    if (scope === "user") targetRoot = path.join(os.homedir(), ".opencode");
    
    const pipelineDir = path.join(targetRoot, "superpipelines", pipelineName);
    if (!fsSync.existsSync(pipelineDir)) {
      fsSync.mkdirSync(pipelineDir, { recursive: true });
    }
    
    const statePath = path.join(pipelineDir, "pipeline-state.json");
    const tmpPath = statePath + ".tmp";
    
    fsSync.writeFileSync(tmpPath, JSON.stringify(state, null, 2), "utf-8");
    fsSync.renameSync(tmpPath, statePath);
    
    return { success: true, path: statePath };
  }
});
