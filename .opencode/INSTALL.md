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

3. Add the local plugin to your OpenCode configuration (`opencode.json` or `~/.config/opencode/opencode.json`):
```json
{
  "plugin": ["./superpipelines-opencode"],
  "superpipelines": {
    "models": {
      "default": "opencode-zen",
      "architect": "opencode-zen",
      "reviewer": "opencode-go"
    }
  }
}
```

The plugin will automatically register its native skills and agents with OpenCode.
