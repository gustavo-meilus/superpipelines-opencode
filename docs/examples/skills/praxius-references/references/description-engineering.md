# Description Engineering

The description is the most important text in the skill. It determines whether the skill is ever used at all.

## Rules

### Rule 1: Write the description FIRST (Critical)

Before any instructions, craft the description. If you cannot write a compelling, specific description, the skill's scope is wrong.

### Rule 2: Third person, always (Critical)

The description is injected into a system prompt or skill index. It must read as a capability statement, not a conversation.

- Good: "Generates conventional commit messages by analyzing staged changes."
- Bad: "I help you write commit messages." / "Use this to write commits."

### Rule 3: WHAT + WHEN in every description (Critical)

- **WHAT**: The specific capabilities (verbs + objects).
- **WHEN**: Trigger scenarios, keywords, file types, or user intents that signal relevance.

### Rule 4: Counter the undertriggering bias (Critical)

Current LLMs tend to not invoke skills even when they would be helpful. To combat this, make descriptions slightly assertive about their relevance. Explicitly enumerate trigger contexts, including non-obvious ones where the user doesn't explicitly name the skill's domain.

Instead of:
> "Helps build dashboards to display internal data."

Write:
> "Builds fast, interactive dashboards for displaying internal data and metrics. Use this skill whenever the user mentions dashboards, data visualization, internal metrics, charts, reporting, or wants to display any kind of structured data -- even if they don't explicitly ask for a 'dashboard.'"

### Rule 5: Front-load the capability (High)

The first clause should state the primary action. Trigger scenarios follow after a period or "Use when..."

### Rule 6: Include semantic triggers (High)

Add synonyms and related terms the user might use. "...commit messages, changelogs, version bumps, release notes" casts a wider discoverability net than "commit messages" alone.

### Rule 7: Understand triggering mechanics (High)

Skills appear in the agent's available skill list with their name + description. The agent decides whether to consult a skill based on that text. Crucially, agents typically only consult skills for tasks they cannot easily handle on their own -- simple, one-step queries may not trigger a skill even with a perfect description match. The description should therefore emphasize the complexity and specialized knowledge the skill provides, not just the topic area.

### Rule 8: Max 1024 characters (Medium)

If you cannot describe the skill concisely, it is doing too much. Split it.

## Description Optimization Process

After the skill is finalized, optimize the description for triggering accuracy using this process:

### Step 1: Generate trigger eval queries

Create 16-20 queries -- a balanced mix of should-trigger (8-10) and should-not-trigger (8-10).

For **should-trigger** queries: Use diverse phrasings of the same intent, from formal to casual. Include cases where the user doesn't explicitly name the skill's domain. Include uncommon use cases and cases where this skill competes with another but should win.

For **should-not-trigger** queries: Focus on near-misses -- queries that share keywords or concepts but actually need something different. Adjacent domains, ambiguous phrasing where naive keyword matching would fire but shouldn't. Do NOT include obviously irrelevant queries (e.g., "write a fibonacci function" as a negative for a PDF skill tests nothing).

All queries must be realistic and detailed -- file paths, personal context, casual speech, abbreviations, varying lengths. Not abstract one-liners.

### Step 2: Review with user

Present the eval set for approval and editing.

### Step 3: Test and iterate

Run the eval queries against the skill's description, score triggering accuracy, and refine the description based on failures. Focus on test-set performance (not training-set) to avoid overfitting.

### Step 4: Apply

Update the description with the optimized version. Show the user before/after with accuracy scores.
