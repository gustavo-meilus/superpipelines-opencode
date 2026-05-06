# Superpipelines OpenCode Installation

To install Superpipelines in your OpenCode workspace, follow these steps:

1. Clone the repository and navigate to the directory:
```bash
git clone https://github.com/gustavo-meilus/superpipelines-opencode.git
cd superpipelines-opencode
```

2. Install dependencies and build the TypeScript plugin:
```bash
npm install
npm run build
```

3. Add the plugin to your OpenCode configuration (`opencode.json` or `~/.config/opencode/opencode.json`):
   ```json
   {
     "plugin": [
       ["file:///path/to/superpipelines-opencode/dist/index.js", {
         "models": {
           "default": "opencode/gemini-3.1-pro",
           "architect": "opencode/gemini-3.1-pro",
           "reviewer": "opencode/gemini-3-flash"
         }
       }]
     ]
   }
   ```
   Or, for npm-installed packages with default models:
   ```json
   {
     "plugin": ["superpipelines-opencode"]
   }
   ```
   Or with custom model configuration:
   ```json
   {
     "plugin": [
       ["superpipelines-opencode", {
         "models": {
           "default": "opencode/gemini-3.1-pro",
           "architect": "opencode/gemini-3.1-pro",
           "reviewer": "opencode/gemini-3-flash"
         }
       }]
     ]
   }
   ```

The plugin will automatically register its native skills and agents with OpenCode.