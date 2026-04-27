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
  - `src/components/Accessibility/` (`AriaLiveRegion`, announcer hooks, notification announcer)
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
  - `AriaLiveRegion` + `useAriaLiveAnnouncer`
  - `NotificationAnnouncer`
- Use `polite` for non-urgent updates; `assertive` for urgent/error updates.
- For repeated announcements, clear then set message (small delay) to force re-announcement.
- For modals, do not use live regions for static body content; rely on correct dialog semantics + focus management.

### 4) Focus management

- Maintain visible focus indicators (do not remove outlines without replacement).
- When trapping focus in dialogs, ensure focus enters the dialog and is restored on close.
- After closing transient dialogs/popovers, restore focus to the invoking trigger when expected.

### 5) Motion preferences

- Respect `prefers-reduced-motion` in both CSS and JS behavior:
  - CSS transitions/animations minimized in `accessibility.scss`
  - JS-driven scrolling/animation behavior downgraded to non-smooth where needed

## ARIA attribute guardrails

- Use ARIA as contract, not decoration:
  - if role implies state, provide matching state attribute (`aria-selected`, `aria-checked`, etc.) only when valid for that role
  - never attach unsupported attributes to roles just to satisfy a visual state
- `aria-hidden` is for decorative/non-essential content only, never for focusable controls.
- Icon-only controls must carry an accessible name on the control element itself.

## i18n rules for accessibility text

1. New accessibility labels/announcements must use `t('aria/...')` or established translation topics.
2. Add keys to all locales in `src/i18n/*.json`.
3. For dynamic values, always use i18n interpolation syntax (for example `t('aria/{{count}} new messages', { count })` or equivalent existing key shape), never string concatenation.
4. Run translation validation/lint flow; no empty translation values.

## Testing requirements per accessibility change

Minimum:

- unit tests for new keyboard/focus/semantics behavior in nearest `__tests__` folder
- one `jest-axe` assertion for components where semantics changed

Recommended:

- regression tests for:
  - Enter/Space activation
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
