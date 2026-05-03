# State Management — Pipeline-Runner Reference

How `running-a-pipeline` writes and reads `tmp/pipeline-state.json`. Companion to `sk-pipeline-state` (which defines the schema).

## Table of contents

1. Read-on-startup flow
2. Initialize new state
3. Atomic write pattern
4. Phase transitions
5. Resume protocol
6. Concurrent pipeline detection
7. Metadata fields used by runner
8. Cleanup on success
9. Cleanup on failure / escalation

---

## Read-on-startup flow

```
1. Check for existing tmp/pipeline-state.json
   ├── Missing → fresh start; proceed to "initialize new state"
   ├── status: "running" AND started_at < 1h ago → live; refuse to start new
   ├── status: "running" AND started_at > 1h ago → crashed; prompt user (resume/restart/abort)
   ├── status: "completed" → "already done"; exit
   ├── status: "escalated" or "failed" → surface to human; do NOT auto-resume
   └── parse error → escalate to human; do NOT auto-resume
```

## Initialize new state

```bash
PIPELINE_ID=$(uuidgen)
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
mkdir -p tmp
cat > tmp/pipeline-state.json.tmp <<EOF
{
  "pipeline_id": "${PIPELINE_ID}",
  "started_at": "${NOW}",
  "pattern": "${PATTERN}",
  "status": "running",
  "current_phase": 0,
  "phases": [...],
  "metadata": {}
}
EOF
mv tmp/pipeline-state.json.tmp tmp/pipeline-state.json
```

## Atomic write pattern

EVERY state update follows the write-temp-then-rename pattern:

```bash
# 1. Read current state
STATE=$(cat tmp/pipeline-state.json)
# 2. Modify (use jq for safety)
NEW_STATE=$(echo "$STATE" | jq --arg phase "$PHASE" '.current_phase = ($phase | tonumber)')
# 3. Write atomically
echo "$NEW_STATE" > tmp/pipeline-state.json.tmp
mv tmp/pipeline-state.json.tmp tmp/pipeline-state.json
```

## Phase transitions

| Transition | State change |
|------------|--------------|
| Phase starts | `phases[i].status = "running"` |
| Phase completes successfully | `phases[i].status = "done"`, `phases[i].outputs = [...]`, `current_phase = i+1` |
| Phase fails (recoverable) | `phases[i].status = "failed"`, `phases[i].error = "..."`, retry per status protocol |
| Phase fails (non-recoverable) | `status = "failed"` (top-level), surface to user |
| Pattern 3 hits max iterations | `status = "escalated"`, write last failure summary to metadata |
| Pipeline completes | `status = "completed"` |

## Resume protocol

When user accepts "resume" prompt for crashed state:

1. Validate `pipeline_id` matches what user expected.
2. Find `phases[i]` with `status: "running"`.
3. Reset `phases[i].status = "pending"` (assume in-progress work was lost).
4. If `phases[i]` had partial outputs that survived, prefer to keep them; otherwise re-dispatch from clean.
5. Continue from `current_phase = i`.

## Concurrent pipeline detection

If `tmp/pipeline-state.json` exists with `status: "running"` and `pipeline_id != $NEW_ID`:

```
echo "Active pipeline detected: $EXISTING_ID started $STARTED_AT"
echo "Cannot start new pipeline. Options:"
echo "  - Wait for active pipeline to finish"
echo "  - Resume the active pipeline (claude /superpipelines:run-pipeline --resume)"
echo "  - Abort the active pipeline (delete state file manually)"
exit 1
```

## Metadata fields used by runner

| Field | Type | Used for |
|-------|------|----------|
| `worktree_root` | string | Path to created worktree (for cleanup) |
| `task_count_target` | integer | Total tasks in pipeline (for progress display) |
| `task_progress` | object | `{ "T-1": "done", "T-2": "running", ... }` |
| `last_failure` | object | Pattern 3 escalation summary |
| `attempted_fixes` | array | Pattern 3 audit trail |

## Cleanup on success

```bash
# Pipeline completed — keep state for audit, but mark for archive
NEW_STATE=$(cat tmp/pipeline-state.json | jq '.status = "completed" | .completed_at = now | todate')
echo "$NEW_STATE" > tmp/pipeline-state.json.tmp
mv tmp/pipeline-state.json.tmp tmp/pipeline-state.json
```

Optional archival: move to `tmp/archive/pipeline-state-${PIPELINE_ID}.json`.

## Cleanup on failure / escalation

Do NOT delete the state file. Surface to user with the absolute path so they can inspect:

```
echo "Pipeline ESCALATED. State preserved at: $(realpath tmp/pipeline-state.json)"
echo "Next steps documented in metadata.last_failure."
```
