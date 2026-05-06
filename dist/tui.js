// src/tui.ts
var superPipelinesTui = async (api, _options, _meta) => {
  api.command.register(() => [
    {
      title: "SuperPipelines: New Pipeline",
      value: "superpipelines:new-pipeline",
      description: "Design a new pipeline workflow",
      category: "SuperPipelines",
      slash: { name: "sp:new", aliases: ["superpipelines:new-pipeline"] }
    },
    {
      title: "SuperPipelines: Run Pipeline",
      value: "superpipelines:run-pipeline",
      description: "Execute an existing pipeline",
      category: "SuperPipelines",
      slash: { name: "sp:run", aliases: ["superpipelines:run-pipeline"] }
    },
    {
      title: "SuperPipelines: Add Step",
      value: "superpipelines:new-step",
      description: "Add a step to an existing pipeline",
      category: "SuperPipelines",
      slash: { name: "sp:add", aliases: ["superpipelines:new-step"] }
    },
    {
      title: "SuperPipelines: Update Step",
      value: "superpipelines:update-step",
      description: "Update an existing pipeline step",
      category: "SuperPipelines",
      slash: { name: "sp:update", aliases: ["superpipelines:update-step"] }
    },
    {
      title: "SuperPipelines: Delete Step",
      value: "superpipelines:delete-step",
      description: "Remove a step from a pipeline",
      category: "SuperPipelines",
      slash: { name: "sp:delete", aliases: ["superpipelines:delete-step"] }
    }
  ]);
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
