---
name: accessibility
description: Maintain WCAG-focused accessibility in stream-chat-react. Use when changing interactive components, dialogs, menus, forms, media controls, notifications, focus behavior, keyboard flows, aria attributes, or screen-reader announcements.
---

# Accessibility Maintenance (stream-chat-react)

Use this skill whenever code changes can affect keyboard users, screen readers, focus behavior, motion preferences, or semantic HTML/ARIA.

## Non-negotiable rules

1. Prefer native semantics first (`button`, `input`, `label`, `img`, etc.). Use ARIA roles only when native semantics cannot represent the widget.
2. Do not add hardcoded English accessibility labels. Use i18n keys (`t('aria/...')`) for user-facing `aria-label`/`aria-description`/announcement strings.
3. Keep one focusable interactive target per action. Avoid duplicate focus stops and nested-interactive patterns.
4. If a control is keyboard-activatable, support Enter/Space behavior and visible focus.
5. Decorative visuals stay hidden from AT (`aria-hidden`, `focusable="false"` for SVG icons).
6. Keep changes additive and backward-compatible for SDK consumers.

## Where to put what

- **Cross-cutting accessibility decisions and scope changes**
  - `specs/wcag-compliance/decisions.md` (append-only decision log)
  - `specs/wcag-compliance/plan.md` and `specs/wcag-compliance/state.json` (task tracking)
- **Shared a11y primitives**
  - `src/components/Accessibility/` — `AriaLiveAnnouncerProvider` + `AriaLiveOutlet` (one announcer per `Chat`; outlets render the live region, innermost/highest-`layer` wins so modal-scoped outlets take over), `useAriaLiveAnnouncer`, `useInteractionAnnouncements` (typed announcement vocabulary), `useFocusReturn` (generic capture-before-steal / restore-on-finish focus restoration), `useInertWhenHidden`, `scheduling/` (debounce/queue policies), notification announcer
  - `src/components/VisuallyHidden/`
- **Global reduced-motion/focus behavior styles**
  - `src/styling/accessibility.scss`
  - `src/styling/base.scss` (shared focus tokens)
- **Component-level semantics and keyboard handling**
  - in the component itself under `src/components/**`
- **Translations for new `aria/...` keys**
  - all locale files in `src/i18n/*.json` (never leave empty values)
- **Tests**
  - nearest component test folder: `src/components/**/__tests__/`
  - include `jest-axe` checks for semantic/ARIA-sensitive changes

## Patterns to follow

### 1) Accessible names and descriptions

- Prefer `aria-labelledby` when visible label text exists.
- Use `aria-label` only as fallback when label-by-id is not available.
- For dialog surfaces:
  - provide `role` and `aria-modal` for modal behavior
  - wire `aria-labelledby` and `aria-describedby` to visible title/description nodes
  - keep dialog title/description IDs on the dialog surface; do not reuse dialog-level `descriptionId` on descendant inputs/buttons just to make the dialog copy read again
  - child controls should reference only control-specific help/error text via `aria-describedby`
  - avoid attaching the dialog description to close buttons in prompt/modal headers
  - when surrounding dialog context is already announced, prefer short close labels (for example existing `t('Close')`) over redundant labels like `Close dialog`
- For images:
  - always render `alt` (`''` when decorative)

### 2) Keyboard behavior

- Native controls: rely on native keyboard behavior whenever possible.
- Non-native interactive wrappers (only when unavoidable):
  - `role="button"`
  - `tabIndex={0}`
  - `onKeyDown` for Enter/Space activation
  - prevent default on Space when needed to avoid scroll side-effects
- Menus/listboxes/tabs:
  - use role-appropriate child roles (`menu`/`menuitem`, `listbox`/`option`, `tablist`/`tab`/`tabpanel`)
  - keep role/attribute combinations valid (example: `menuitemradio` with `aria-checked`)

### 3) Live regions and announcements

- Prefer centralized announcers over ad-hoc `aria-live` scattered across components:
  - `useAriaLiveAnnouncer` (the one sink; provided by `AriaLiveAnnouncerProvider`, rendered by `AriaLiveOutlet`)
  - `useInteractionAnnouncements` for the typed, intention-revealing vocabulary (`announceInteraction('giphy.sent')`, etc.)
  - `NotificationAnnouncer` (routes through the same sink)
- Use `polite` for non-urgent updates; `assertive` for urgent/error updates.
- The announcer is the **decoupled channel ONLY** — see the focus-coupled rule below. It is the right tool when something changes and focus does NOT move to it (incoming messages, filtered result counts while focus stays in the input, confirmations where focus returns elsewhere).
- For repeated announcements, the announcer appends a fresh node per call (no clear-then-set dance needed); for rapidly-updating streams use a `scheduling/` debounce, not raw spam.
- For modals, do not use live regions for static body content; rely on correct dialog semantics + focus management.
- **`aria-modal="true"` suppresses live regions outside its subtree.** VoiceOver (and most ATs) ignore live regions that are not descendants of the active `aria-modal` container. The unified announcer handles this with a stack of `AriaLiveOutlet`s: mount an `<AriaLiveOutlet layer={1} />` inside the modal subtree (the `Modal`/`Dialog` components already do) and the provider renders into it while the modal is open. Do not "fix" missing announcements by escalating polite -> assertive; if the region is outside the modal, no priority will save it.

#### Focus-coupled vs decoupled — choose the channel by whether focus moves

This is the single most important announcement decision. Every "tell the screen reader something" need is one of two kinds; using the wrong channel produces a race (the announcement is dropped) or duplicate/overlapping speech.

- **Focus moves to / into the thing being announced** (a control auto-focuses; a surface appears and takes focus; reorder/tab/step navigation shifts focus): the screen reader already speaks the focused control on the focus event. Encode the message in the **focused control's accessible name/description** — dynamic `aria-label`, or `aria-labelledby` + `aria-describedby` on the control or its enclosing labelled group. Do NOT also fire a live-region message; it races with the focus event and is dropped.
- **Focus does NOT move** (incoming message, async state change, a count updating while focus stays in the field, pickup/drop where focus is unchanged, a confirmation where focus returns to a _different_ element): use the **live-region announcer**.

**A transient surface that appears AND auto-focuses a control is focus-coupled.** (Giphy preview auto-focusing "Send"; a popover/dialog moving focus inside.) Put the surface's purpose + visibility scope + available actions on the focused control or its enclosing `role="group"`/`region`/`dialog` via `aria-label`/`aria-labelledby` + `aria-describedby` — so focusing "Send" reads e.g. "Send, button, Giphy preview — only visible to you. 3 actions: Send, Shuffle, Cancel." A polite live-region announcement here is preempted by the focus event and never heard.

**Positional context ("list N items", "tab panel") comes from ancestor containers, not the control's name — an `aria-label` on the control alone cannot remove it.** A transient action surface rendered inside a semantic container (message `<ul>`, tabpanel) inherits that container's role + set size in focus announcements. Two things help:

- **A labelled grouping immediately around the controls** (`role="group"`/`region` + `aria-label`) becomes the nearest named container, so AT announces THAT instead of the outer list/tabpanel. Verified on VoiceOver for the giphy preview: wrapping Send/Shuffle/Cancel in `role="group"` aria-label "Giphy actions" stopped the "list, N items" leak without moving the DOM. Often sufficient; confirm per screen reader (NVDA may differ).
- **Placement** is the guaranteed fix: render the surface **outside** the container (a sibling of the `<ul>`), as `VirtualizedMessageList` does for the giphy preview. Use this if a labelled grouping doesn't suppress the leak in your target SRs or restructuring is cheap.

### 4) Focus management

- Maintain visible focus indicators (do not remove outlines without replacement).
- When trapping focus in dialogs, ensure focus enters the dialog and is restored on close.
- Initial dialog focus depends on dialog type:
  - short task-oriented form dialogs: usually prefer the first meaningful control
  - content-heavy or context-first dialogs: focusing the dialog container or a static heading with `tabIndex={-1}` can be appropriate
  - destructive confirmation dialogs: prefer the least destructive action
- Treat dialog-surface/title initial focus as an explicit tradeoff, not a universal default.
- If using dialog-surface initial focus to improve announcement reliability, keep it opt-in for specific dialogs instead of changing all modals globally.
- After closing transient dialogs/popovers, restore focus to the invoking trigger when expected.

### 5) Keyboard reorder / drag-and-drop fallback

When a list supports drag-and-drop reordering, provide a keyboard equivalent driven by a per-row toggle handle (Space picks up, ArrowUp/Down move, Space/Enter/Escape/Tab/blur drop):

- **`aria-pressed` on the toggle handle** communicates picked-up state; do not invent a custom ARIA state.
- **Focus follows the moved item.** After a move, focus belongs to the handle now at the item's new position — not on a static slot, the previous DOM node, or the list container. Otherwise sighted/keyboard and AT users diverge on what is "selected".
- **Stable keys + persistent DOM nodes for the handle.** Key the row (or just the handle) so React does not unmount it across reorders. Unmounting the focused element drops focus to `<body>` and aborts the keyboard mode mid-press. A common approach is keying handles by row index and re-applying focus to that index after the array reorders, using a refs-by-index registry and `useLayoutEffect`.
- **Do not move focus to a sibling input** (the row's text field, the container, etc.) on activation. The handle owns the keyboard mode for its full lifecycle.
- **Encode the new position in the active handle's `aria-label`.** While picked up, expand the label to include item identity, current position, and total (`Reorder "{name}" at position {n} of {total}`). When focus shifts to the handle at the new position after ArrowUp/Down, the native focus announcement carries the move information — no parallel live-region message needed.
- **Use live-region announcements only for pickup and drop**, where focus does not shift. These are the events the dynamic `aria-label` cannot cover.
- **`aria-activedescendant` is not a substitute for moving real DOM focus** in this pattern on Chrome + VoiceOver. It is unreliable for tracking moves; prefer real focus management.

### 6) Motion preferences

- Respect `prefers-reduced-motion` in both CSS and JS behavior:
  - CSS transitions/animations minimized in `accessibility.scss`
  - JS-driven scrolling/animation behavior downgraded to non-smooth where needed

## ARIA attribute guardrails

- Use ARIA as contract, not decoration:
  - if role implies state, provide matching state attribute (`aria-selected`, `aria-checked`, etc.) only when valid for that role
  - never attach unsupported attributes to roles just to satisfy a visual state
- `aria-hidden` is for decorative/non-essential content only, never for focusable controls.
- Icon-only controls must carry an accessible name on the control element itself.

## Screen Reader Dialog Quirks

- macOS VoiceOver may re-announce ancestor dialog/group context (for example `dialog, 5 items`) when focus moves to controls inside a dialog.
- This repeated container announcement is often screen-reader behavior, not necessarily a labeling bug in the app.
- Distinguish between:
  - expected container-context announcement from the screen reader
  - actual label leakage caused by descendant `aria-describedby` / `aria-labelledby`
- Fix leakage in code; do not try to fight VoiceOver container announcements with extra ARIA or live-region workarounds.

## i18n rules for accessibility text

1. New accessibility labels/announcements must use `t('aria/...')` or established translation topics.
2. Add keys to all locales in `src/i18n/*.json`.
3. For dynamic values, always use i18n interpolation syntax (for example `t('aria/{{count}} new messages', { count })` or equivalent existing key shape), never string concatenation.
4. Run translation validation/lint flow; no empty translation values.

## Testing requirements per accessibility change

Minimum:

- unit tests for new keyboard/focus/semantics behavior in nearest `__tests__` folder
- one `jest-axe` assertion for components where semantics changed
- for modal changes, verify dialog-surface semantics (`role`, `aria-labelledby`, `aria-describedby`) and that descendant controls do not inherit dialog descriptions unless explicitly intended

Recommended:

- regression tests for:
  - Enter/Space activation
  - initial focus target for dialogs that use custom open-focus behavior
  - role/state attributes
  - focus restore on close
  - reduced-motion behavior where logic branches in JS

## Execution workflow (copy this checklist)

- [ ] Identify the interaction type (button/menu/dialog/listbox/form/slider/live region)
- [ ] Choose native element first; fall back to ARIA only if necessary
- [ ] Add or correct label wiring (`aria-labelledby` preferred, `aria-label` fallback)
- [ ] Verify keyboard path (Tab + Enter/Space + arrow keys where pattern requires)
- [ ] Verify focus visibility and focus restore behavior
- [ ] Ensure decorative visuals are hidden from AT and icon-only controls are named
- [ ] Add/update i18n keys for new accessibility text across all locales
- [ ] Add/update tests (`jest-axe` where semantics changed)
- [ ] Append rationale to `specs/wcag-compliance/decisions.md` for cross-cutting decisions

## Common mistakes to avoid

- Hardcoded English `aria-label` values in component code.
- Adding `tabIndex`/roles to containers that only capture backdrop clicks.
- Creating two focusable wrappers for one action path.
- Introducing invalid role/attribute pairs (for example `aria-selected` on plain buttons).
- Using live regions to force modal text announcement instead of fixing dialog semantics.
- Using placeholders as the only field label, or combining a visible label with a redundant placeholder that causes extra screen-reader chatter without adding meaning.
- Treating repeated VoiceOver dialog/group announcements as proof that app markup is wrong before checking whether descendant controls are actually inheriting dialog descriptions.
- Live region rendered outside the active `aria-modal="true"` subtree (for example portalled to `document.body`) — the announcements are silently dropped. Ensure an `AriaLiveOutlet` (layer above the root) is mounted inside the modal subtree.
- Emitting a live-region message for an action that also shifts focus — causes overlapping announcements / the message is dropped. Encode the new state in the focused control's `aria-label`/`aria-describedby` instead.
- Announcing a transient surface that appears AND auto-focuses a control (giphy preview auto-focusing Send, a popover moving focus inside) via the live-region announcer — the focus event preempts it and it is never heard. Describe the focused control or its enclosing labelled group instead.
- Trying to remove inherited container context ("list N items", "tab panel") from a transient surface with an `aria-label` on the control — the name changes but the ancestor's positional context remains. Render the surface outside the container (sibling of the `<ul>`/tabpanel).
- Remounting the focused control to "reset" its accessible name; this drops focus to `<body>` and breaks keyboard flows. Update attributes on the existing node.
- Moving focus to a sibling (text input, container) when activating a per-row keyboard mode (reorder, edit, etc.). The activating control must keep focus until the mode ends.
- Reaching for `aria-activedescendant` to fix VoiceOver tracking on Chrome instead of moving real DOM focus.
- Passing both an index and a derived position/label prop to a child component when one can be computed from the other — keep one source of truth, derive the rest in the child.
