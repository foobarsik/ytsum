#!/usr/bin/env bash
# PreToolUse gate for Write|Edit on UI files (src/app/**, src/components/** .tsx).
# Enforces the AGENTS.md "UX Feature Insertion Guide" deterministically:
#   - First UI edit in a session is DENIED with the audit checklist, forcing the
#     pre-implementation UX audit + Tier 1 static review before any code is written.
#   - Subsequent UI edits in the same session are ALLOWED but the reminder is
#     re-injected as context so the gate stays visible.
# The harness runs this — compliance does not depend on the model remembering to.

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only gate UI source files.
case "$file" in
  *src/app/*.tsx | *src/components/*.tsx) ;;
  *) exit 0 ;;
esac

session=$(printf '%s' "$input" | jq -r '.session_id // "nosession"')
sentinel="${TMPDIR:-/tmp}/agents-ux-gate-${session}"

read -r -d '' message <<'EOF'
AGENTS.md UX gate — this file is a user-visible UI surface. Before editing, complete the required pre-implementation UX audit (AGENTS.md "Required pre-implementation UX audit") and state it in your response:
1. User intent and the exact moment the feature is needed.
2. Classification: core / supporting / advanced / recovery.
3. Existing element or section it belongs with.
4. The screen's current primary action.
5. Whether this adds a new always-visible action, and why that visibility is justified.
6. Narrow-mobile behavior: COUNT always-visible controls in the target region BEFORE and AFTER the change. Adding one to a row that already holds a text/primary button is an overflow risk you must carry into rendered verification.

Then Tier 1 static review (always required): state coverage for every UI state (signed-in / signed-out / not-configured / empty / error), grouping & hierarchy (no low-frequency action beside primary nav; no orphaned info+action), accessibility statics (icon-only controls named; menus have roles, aria-expanded, escape + outside-click).

Tier 2 rendered verification is required for any geometric/data-dependent uncertainty (desktop + <=375px). If you cannot render, say so explicitly and report responsive behavior as UNVERIFIED — do NOT claim "no UX uncertainty".

Re-attempt this edit only after the audit is stated. Read AGENTS.md if you have not this session.
EOF

if [ -f "$sentinel" ]; then
  # Already gated this session: allow, but keep the reminder visible.
  jq -n --arg m "$message" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", additionalContext: $m}}'
else
  touch "$sentinel"
  jq -n --arg m "$message" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $m}}'
fi
