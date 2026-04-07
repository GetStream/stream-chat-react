# Channel Header Figma Implementation

## Worktree

| Field              | Value                                                 |
| ------------------ | ----------------------------------------------------- |
| **Path**           | `../stream-chat-react-worktrees/channel-header-figma` |
| **Branch**         | `feat/channel-header-figma`                           |
| **Base branch**    | `feat/add-message-translation-indicator`              |
| **Preview branch** | `agent/feat/channel-header-figma` (create when ready) |

**Agent must `cd` into the worktree before any work:**

```bash
cd ../stream-chat-react-worktrees/channel-header-figma
yarn install
```

---

## Task Overview

Tasks are self-contained; styling and component tasks have a dependency order. All work in `src/components/ChannelHeader/`.

---

## Design Reference

**Figma:** [Chat SDK Design System – Web / Headers](https://www.figma.com/design/Us73erK1xFNcB5EH3hyq6Y/Chat-SDK-Design-System?node-id=1899-32506&m=dev)

**Key design elements (channel header section):**

- Layout: `[sidebar toggle slot] | [channelName + Online stacked] | [avatar right]`
- Sidebar toggle is provided externally via `SidebarToggle` in `ComponentContext`
- Avatar on the right (current impl has it between toggle and title)

---

## Task 1: Create ChannelHeader Styling Folder and Base Styles

**File(s) to create:** `src/components/ChannelHeader/styling/ChannelHeader.scss`, `src/components/ChannelHeader/styling/index.scss`

**Dependencies:** None

**Status:** pending

**Owner:** unassigned

**Scope:**

- Create `src/components/ChannelHeader/styling/` folder
- `ChannelHeader.scss`: Base layout using `@include utils.header-layout`, full class names per dev-patterns
- Layout: flex, avatar right-aligned (`margin-left: auto` or `justify-content: space-between`)
- Use design tokens: `--str-chat__channel-header-background-color`, typography vars, spacing
- `index.scss`: `@use './ChannelHeader'` (or forward)
- **Do NOT** register in `src/styling/index.scss` yet (Task 3)

**Acceptance Criteria:**

- [ ] `ChannelHeader.scss` exists with `.str-chat__channel-header` and child selectors
- [ ] Uses full class names, no `&__suffix`-only blocks for same selector
- [ ] `index.scss` forwards/uses ChannelHeader.scss

---

## Task 2: Register ChannelHeader Styles and Update Component

**File(s) to create/modify:** `src/styling/index.scss`, `src/components/ChannelHeader/ChannelHeader.tsx`

**Dependencies:** Task 1

**Status:** pending

**Owner:** unassigned

**Scope:**

- Add `@use '../components/ChannelHeader/styling' as ChannelHeader` to `src/styling/index.scss` in the appropriate group (alphabetical, chat components)
- Update `ChannelHeader.tsx`:
  - Reorder layout: sidebar toggle slot | text block (title + Online) | avatar (right)
  - The sidebar toggle is provided externally via the `SidebarToggle` slot in `ComponentContext` (no built-in toggle or `MenuIcon` prop)
  - Simplify info line to "Online" (or keep watcher_count: "X online") per design
- Preserve: `live`, `subtitle`, `member_count`, `Avatar`, `title`, `image` — ensure backward compatibility
- Note: sidebar collapsed/expanded state is NOT managed by the SDK; the app owns sidebar visibility

**Acceptance Criteria:**

- [ ] ChannelHeader styles imported in `src/styling/index.scss`
- [ ] Component layout matches Figma: avatar on right, text in middle
- [ ] `SidebarToggle` slot renders when provided via `ComponentContext`
- [ ] Existing tests pass; update tests if needed for new structure

---

## Task 3: Integration and Tests

**File(s) to create/modify:** `src/components/ChannelHeader/__tests__/ChannelHeader.test.js`

**Dependencies:** Task 2

**Status:** pending

**Owner:** unassigned

**Scope:**

- Run existing tests; fix any failures from layout/class changes
- Add tests for `SidebarToggle` slot rendering when applicable
- Ensure `yarn test`, `yarn types`, `yarn lint-fix` pass

**Acceptance Criteria:**

- [ ] All existing tests pass
- [ ] New props covered if feasible
- [ ] `yarn types` and `yarn lint-fix` pass

---

## Execution Order

| Phase | Tasks  | Can run in parallel?   |
| ----- | ------ | ---------------------- |
| 1     | Task 1 | —                      |
| 2     | Task 2 | No (depends on Task 1) |
| 3     | Task 3 | No (depends on Task 2) |

---

## File Ownership Summary

| Task | Creates                                                                        | Modifies                                                    |
| ---- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 1    | `ChannelHeader/styling/ChannelHeader.scss`, `ChannelHeader/styling/index.scss` | —                                                           |
| 2    | —                                                                              | `src/styling/index.scss`, `ChannelHeader/ChannelHeader.tsx` |
| 3    | —                                                                              | `ChannelHeader/__tests__/ChannelHeader.test.js`             |

---

## Notes

- ChannelHeader currently has no dedicated styling folder; styles may come from stream-chat-css. This plan introduces ChannelHeader/styling per dev-patterns.
- Loading channel header in `Channel/styling/Channel.scss` uses `--str-chat__channel-header-background-color`; keep variable usage consistent.
- Sidebar toggle is externally provided via `SidebarToggle` slot in `ComponentContext`. The SDK does not own sidebar state — apps provide their own toggle via `WithComponents`.
- No `sidebarCollapsed` prop or `MenuIcon` prop — these were removed as part of the navOpen removal.
