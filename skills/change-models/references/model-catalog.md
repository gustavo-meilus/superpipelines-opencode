# Model Catalog — Static Fallback

> Curated list of available LLM models organized by provider. Used as a fallback when live API fetches fail. Last updated: 2026-05-11.

## OpenCode Zen (`opencode/*`)

Pay-as-you-go models with per-token pricing. API endpoint: `https://opencode.ai/zen/v1/`

| Model ID | Display Name | Type |
|----------|-------------|------|
| `opencode/big-pickle` | Big Pickle | Free |
| `opencode/ring-2.6-1t-free` | Ring 2.6 1T | Free |
| `opencode/minimax-m2.5-free` | MiniMax M2.5 Free | Free |
| `opencode/nemotron-3-super-free` | Nemotron 3 Super Free | Free |
| `opencode/gpt-5.5` | GPT 5.5 | Paid |
| `opencode/gpt-5.5-pro` | GPT 5.5 Pro | Paid |
| `opencode/gpt-5.4` | GPT 5.4 | Paid |
| `opencode/gpt-5.4-pro` | GPT 5.4 Pro | Paid |
| `opencode/gpt-5.4-mini` | GPT 5.4 Mini | Paid |
| `opencode/gpt-5.4-nano` | GPT 5.4 Nano | Paid |
| `opencode/gpt-5.3-codex` | GPT 5.3 Codex | Paid |
| `opencode/gpt-5.3-codex-spark` | GPT 5.3 Codex Spark | Paid |
| `opencode/gpt-5.2` | GPT 5.2 | Paid |
| `opencode/gpt-5.2-codex` | GPT 5.2 Codex | Paid |
| `opencode/gpt-5.1` | GPT 5.1 | Paid |
| `opencode/gpt-5.1-codex` | GPT 5.1 Codex | Paid |
| `opencode/gpt-5.1-codex-max` | GPT 5.1 Codex Max | Paid |
| `opencode/gpt-5.1-codex-mini` | GPT 5.1 Codex Mini | Paid |
| `opencode/gpt-5` | GPT 5 | Paid |
| `opencode/gpt-5-codex` | GPT 5 Codex | Paid |
| `opencode/gpt-5-nano` | GPT 5 Nano | Paid |
| `opencode/claude-opus-4-7` | Claude Opus 4.7 | Paid |
| `opencode/claude-opus-4-6` | Claude Opus 4.6 | Paid |
| `opencode/claude-opus-4-5` | Claude Opus 4.5 | Paid |
| `opencode/claude-opus-4-1` | Claude Opus 4.1 | Paid |
| `opencode/claude-sonnet-4-6` | Claude Sonnet 4.6 | Paid |
| `opencode/claude-sonnet-4-5` | Claude Sonnet 4.5 | Paid |
| `opencode/claude-sonnet-4` | Claude Sonnet 4 | Paid |
| `opencode/claude-haiku-4-5` | Claude Haiku 4.5 | Paid |
| `opencode/claude-3-5-haiku` | Claude Haiku 3.5 | Paid |
| `opencode/gemini-3.1-pro` | Gemini 3.1 Pro | Paid |
| `opencode/gemini-3-flash` | Gemini 3 Flash | Paid |
| `opencode/qwen3.6-plus` | Qwen3.6 Plus | Paid |
| `opencode/qwen3.5-plus` | Qwen3.5 Plus | Paid |
| `opencode/minimax-m2.7` | MiniMax M2.7 | Paid |
| `opencode/minimax-m2.5` | MiniMax M2.5 | Paid |
| `opencode/glm-5.1` | GLM 5.1 | Paid |
| `opencode/glm-5` | GLM 5 | Paid |
| `opencode/kimi-k2.5` | Kimi K2.5 | Paid |
| `opencode/kimi-k2.6` | Kimi K2.6 | Paid |

## OpenCode Go (`opencode-go/*`)

Low-cost subscription models. API endpoint: `https://opencode.ai/zen/go/v1/`

| Model ID | Display Name | Monthly Limit |
|----------|-------------|---------------|
| `opencode-go/glm-5.1` | GLM 5.1 | 880 req/5hr |
| `opencode-go/glm-5` | GLM 5 | 1,150 req/5hr |
| `opencode-go/kimi-k2.5` | Kimi K2.5 | 1,850 req/5hr |
| `opencode-go/kimi-k2.6` | Kimi K2.6 | 1,150 req/5hr |
| `opencode-go/mimo-v2.5` | MiMo-V2.5 | 2,150 req/5hr |
| `opencode-go/mimo-v2.5-pro` | MiMo-V2.5-Pro | 1,290 req/5hr |
| `opencode-go/minimax-m2.7` | MiniMax M2.7 | 3,400 req/5hr |
| `opencode-go/minimax-m2.5` | MiniMax M2.5 | 6,300 req/5hr |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus | 3,300 req/5hr |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus | 10,200 req/5hr |
| `opencode-go/deepseek-v4-pro` | DeepSeek V4 Pro | 3,450 req/5hr |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 31,650 req/5hr |

## Common Built-in Providers

These providers require API keys configured via `/connect` or environment variables.

| Provider Prefix | Example Model IDs | API Key Source |
|----------------|-------------------|---------------|
| `anthropic/` | `claude-sonnet-4-5`, `claude-opus-4-6`, `claude-haiku-4-5` | Anthropic API key |
| `openai/` | `gpt-5.5`, `gpt-5.4`, `gpt-5.3-codex` | OpenAI API key |
| `google/` | `gemini-3.1-pro`, `gemini-3-flash` | Google API key |
| `deepseek/` | `deepseek-v4-pro`, `deepseek-v4-flash` | DeepSeek API key |
| `groq/` | Various | Groq API key |
| `openrouter/` | Various (via OpenRouter) | OpenRouter API key |

## Custom / Local Providers

These are defined in `opencode.json` under the `provider` key. Common examples:

| Provider ID | Example Config | Notes |
|------------|---------------|-------|
| `ollama` | `ollama/llama2`, `ollama/codellama` | Local Ollama instance |
| `lmstudio` | `lmstudio/google/gemma-3n-e4b` | Local LM Studio instance |
| `llama.cpp` | `llama.cpp/qwen3-coder:a3b` | Local llama.cpp server |
| `atomic-chat` | `atomic-chat/<model-id>` | Local Atomic Chat server |

Custom providers are defined with their own models in `opencode.json`:

```jsonc
{
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama (local)",
      "options": { "baseURL": "http://localhost:11434/v1" },
      "models": {
        "llama2": { "name": "Llama 2" },
        "codellama": { "name": "Code Llama" }
      }
    }
  }
}
```

The provider ID becomes the prefix: `ollama/llama2`, `ollama/codellama`.

## Fuzzy Match Reference

Common aliases users might type and their canonical model IDs:

| User Input | Canonical Match |
|-----------|----------------|
| "big pickle" | `opencode/big-pickle` |
| "sonnet 4.6" / "claude sonnet" | `opencode/claude-sonnet-4-6` |
| "opus 4.7" / "claude opus" | `opencode/claude-opus-4-7` |
| "haiku" | `opencode/claude-haiku-4-5` |
| "gpt 5.5" | `opencode/gpt-5.5` |
| "gpt 5 codex" | `opencode/gpt-5-codex` |
| "gemini pro" | `opencode/gemini-3.1-pro` |
| "qwen 3.6 plus" / "qwen3.6" | `opencode/qwen3.6-plus` |
| "qwen 3.5 plus" / "qwen3.5" | `opencode/qwen3.5-plus` |
| "deepseek v4 pro" / "deepseek" | `opencode/deepseek-v4-pro` (Zen) or `opencode-go/deepseek-v4-pro` (Go) |
| "glm 5.1" | `opencode/glm-5.1` (Zen) or `opencode-go/glm-5.1` (Go) |
| "kimi k2.6" | `opencode/kimi-k2.6` (Zen) or `opencode-go/kimi-k2.6` (Go) |
| "minimax m2.7" | `opencode/minimax-m2.7` (Zen) or `opencode-go/minimax-m2.7` (Go) |
| "mimo v2.5 pro" | `opencode-go/mimo-v2.5-pro` (Go only) |