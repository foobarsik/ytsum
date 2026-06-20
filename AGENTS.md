# UX Feature Insertion Guide

Use this when adding a new feature to an existing screen or flow.

## Main rule

Do not place new UI wherever it is easiest in code.

Before adding anything, inspect the surrounding UX context:

- current screen purpose
- nearby components
- existing hierarchy
- primary and secondary actions
- user flow before and after this point
- existing visual/component patterns

The new feature must feel like part of the current flow, not an attached widget.

## Before placing a new feature

Answer internally:

1. What user intent triggers this feature?
2. At what moment does the user need it?
3. Which existing element is it most related to?
4. Is it primary, secondary, optional, or advanced?
5. Should it be always visible, contextual, collapsed, or behind a detail view?
6. Does it compete with the current primary action?

## Placement rules

Prefer placing new UI:

- near the data/action it modifies
- inside the relevant card/section
- after the user has enough context
- before the point where the user must decide
- using the same component pattern as nearby elements

Avoid placing new UI:

- at the bottom just because it is easy
- in the header unless it is global
- as a floating button unless it is a core repeated action
- as a modal unless interruption is necessary
- as a new section if it belongs inside an existing one

## Integration hierarchy

Classify the feature before implementation:

### Core

Needed for the main task. Place visibly in the main flow.

### Supporting

Useful but not required. Place near the related content, visually secondary.

### Advanced

Only needed sometimes. Hide behind details, settings, or a secondary action.

### Recovery

Used when something fails. Place in empty/error/loading states, not in the happy path.

## Existing UI first

Before creating new UX, check:

- Is there an existing similar component?
- Is there an existing section this belongs to?
- Is there an existing action pattern?
- Is there an existing empty/error state pattern?
- Is there an existing copy style?

Reuse the nearest matching pattern unless it clearly does not fit.

## Do not degrade the current screen

Adding a feature must not:

- make the primary action less obvious
- increase visual noise without need
- duplicate existing actions
- create two competing flows
- push important existing content too far down
- introduce a different design language

## If unsure

Choose the least invasive option:

- place it near the related element
- make it secondary
- keep copy explicit
- avoid new navigation
- avoid modal/floating UI
- leave a TODO explaining the UX uncertainty

## Final response requirement

When adding a feature, mention:

- where it was placed
- why it belongs there
- what nearby existing pattern it follows
- any UX uncertainty
