---
name: dev-patterns
description: Styling and structure conventions for stream-chat-react. Use when adding or editing components, SCSS, or icons in this repo—file layout, styling folder structure, SCSS imports, and icon placement.
---

# stream-chat-react Development Patterns

Apply when generating or modifying UI code in this repo.

## Styling

### File and folder structure

- **Format:** `.scss` only.
- **Location:** `src/components/<ComponentName>/styling/`.
- **Required:** Each component styling folder has an `index.scss`.
- **Registration:** Each `src/components/<ComponentName>/styling/index.scss` is imported in `src/styling/index.scss` with an alias.

**Import order in `src/styling/index.scss`:**

1. Three groups; within each group, alphabetical order.
2. **Group 1:** imports from `src/styling/`.
3. **Group 2:** general components (Button, Dialog, etc.).
4. **Group 3:** chat components (MessageList, etc.).

### SCSS practices

- Use **full class names** instead of only `&__suffix` so selectors are easy to search.
- Avoid duplicate blocks for the same resolved CSS selector (after nesting).

## Icons

- Icons live in `src/components/Icons`.
- **Do not** move icons out of SCSS into `src/components/Icons`; keep existing icon placement unless explicitly refactoring icons.

Source: `.ai/DEV_PATTERNS.md`.

## Imports

When importing from 'stream-chat' library, always import by library name (from 'stream-chat'), not relative path (from '..path/to/from 'stream-chat-js/src').
