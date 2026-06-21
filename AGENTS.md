# UX Feature Insertion Guide

Use this for every user-visible change to an existing screen or flow. This is a required
implementation gate, not optional design advice.

## Non-negotiable rule

Do not add UI until you have evaluated the whole region that will contain it. A feature can use
the correct component and still create a bad experience by damaging hierarchy, grouping,
density, or responsive behavior.

An existing implementation, deleted component, mockup, or nearby button is evidence of intent,
not proof that its UX is correct. Never restore or copy UI without re-evaluating it in the current
screen.

## Required pre-implementation UX audit

Before editing code, state briefly in the work update:

1. The user intent and exact moment the feature is needed.
2. Its classification: core, supporting, advanced, or recovery.
3. The existing element or section it belongs with.
4. The screen's current primary action.
5. Whether the change adds a new always-visible action and why that visibility is justified.
6. What will happen on narrow mobile widths. Count the always-visible controls in the target
   region before and after the change; adding one to a row that already holds a text or primary
   button is a narrow-width overflow risk you must carry into rendered verification.

If any answer is unknown, inspect the running UI and nearby components before implementing.
Do not silently choose the easiest code location.

## Integration hierarchy

### Core

Required to complete the screen's main task. Keep it visible in the main flow.

### Supporting

Useful during the main task but not required. Place it near the content it affects and make it
visually secondary.

### Advanced

Infrequent, account-level, destructive, administrative, or expert-only. Put it behind a relevant
menu, details view, settings surface, or secondary action. Do not give it permanent primary
navigation space without a documented reason.

### Recovery

Needed only when something fails or is empty. Put it in the corresponding empty, error, loading,
or interrupted state, not in the happy path.

## Placement and grouping rules

Prefer placing UI:

- beside the data or action it changes
- inside the existing card or section that owns it
- after the user has enough context and before they must decide
- grouped with actions that share the same object, scope, and frequency
- using the closest existing component and copy pattern
- in an always-visible region only when the feature is global and frequently needed

Do not:

- put UI at the bottom merely because implementation is easy
- put local actions in global or persistent interface regions
- render related account information and account actions as separate orphaned controls
- expose infrequent actions such as sign out, delete, or administration beside primary navigation
- add another bordered button when a menu item, inline action, or existing group is more appropriate
- give passive information the same visual weight as an action
- fill persistent interface regions with low-frequency controls
- use a modal unless interruption is required
- create a new section when the feature belongs inside an existing one

## Whole-region regression check

After deciding placement, reassess the complete containing region—not only the new component.
The change must not:

- make the primary action less obvious
- increase visual noise without a proportional benefit
- create multiple actions with equal emphasis
- separate information from the action that owns it
- duplicate an existing route or action
- push important content below the fold unnecessarily
- introduce a different interaction or visual language
- overflow, wrap, clip, or become crowded at supported widths

If it does, redesign the surrounding group. Do not patch the symptom with smaller text or tighter
spacing unless density is genuinely the intended design.

## Mandatory stop conditions

Stop and revise the design before declaring completion if any of these are true:

- a low-frequency action is as prominent as the screen's primary action
- related information and actions appear as separate ungrouped items
- four or more adjacent controls use the same button treatment
- the feature is visible before the user has context for it
- the narrow layout relies on everything barely fitting
- labels disappear on mobile without an accessible name or familiar meaning
- the implementation was copied or restored without inspecting its effect on the current UI
- visual behavior was not checked but the result is being described as having no UX uncertainty

## Existing UI first

Before creating a component, check for an existing:

- component serving the same interaction
- section that owns the same data
- action group or overflow menu
- empty, error, or loading pattern
- copy and terminology pattern

Reuse the nearest valid pattern. “Existing” does not override hierarchy, grouping, frequency, or
responsive requirements.

## Required verification: static first, then rendered

Verify in two tiers. The static tier is always required and catches most problems without running
anything. The rendered tier confirms only what static reasoning cannot prove. Rendering is for
_confirmation_, not for forming the _suspicion_ — most defects are visible in the code first.

### Tier 1 — static review (code only, always required)

Determinable by reading the code; no browser needed. A failure here is enough to require a
redesign before you ever render:

- Count the always-visible controls in the target region before and after the change. Adding one
  to a row that already holds a text or primary button is a likely overflow on narrow widths —
  treat it as suspect and carry it into Tier 2.
- State coverage: every state the UI can be in (e.g. signed-in, signed-out, not-configured, empty,
  error) renders a sensible control set. Trace each conditional-visibility branch and confirm which
  controls appear in each state.
- Grouping and hierarchy: related information and actions stay together; low-frequency actions are
  not beside primary navigation; no orphaned controls.
- Accessibility statics: icon-only controls have accessible names; menus have roles,
  `aria-expanded`, and keyboard/escape plus outside-click handling.
- Classification and placement match the hierarchy and grouping rules above.

### Tier 2 — rendered verification (required whenever Tier 1 leaves geometric or data-dependent uncertainty)

Static reasoning gives suspicion, not proof, for anything that depends on rendered geometry or
runtime data. For a runnable UI, render and confirm:

- The pixel verdict on overflow, wrapping, clipping, overlap, horizontal scroll, or a crowded
  control row — at least one desktop width and one narrow mobile width (375px or narrower; check
  320px when feasible).
- Dropdowns and menus stay within the viewport, have no z-index or overlap defects, and actually
  open and dismiss (click, keyboard/escape).
- The primary action remains visually dominant.
- States that depend on data or session you could not evaluate statically.

Any Tier-1 suspect (such as an added control in a fixed row) MUST be confirmed in Tier 2. If
rendering is unavailable, say so explicitly in the final response, name the unverified Tier-2
items, and report responsive behavior as unverified. Do not claim there is no UX uncertainty.

## If uncertainty remains

Choose the least invasive option:

- place it near the owning element
- reduce its visual prominence
- collapse advanced or infrequent actions
- keep copy explicit
- avoid new navigation, modals, and floating UI
- leave a TODO describing the exact UX uncertainty when it cannot be resolved

## Definition of done

A user-visible feature is not done until all are true:

- placement follows user intent rather than code convenience
- classification matches its prominence
- related information and actions are grouped
- the existing primary action remains clear
- the Tier 1 static review passed, and any geometric or data-dependent uncertainty it raised was
  confirmed by rendered (desktop and mobile) verification, or the lack of visual verification is
  disclosed
- relevant interaction and accessibility states were checked
- no mandatory stop condition remains

## Final response requirement

When adding a feature, report:

- where it was placed and what owns it
- its classification and why its prominence matches
- which nearby pattern it follows
- what the Tier 1 static review covered, and which desktop/mobile and interaction states were
  actually rendered to confirm it
- any remaining UX uncertainty; “none” is allowed only after the suspect items were rendered
