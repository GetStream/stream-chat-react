# Deprecated API Removal Plan

## Context

The SDK (currently at v14 beta) has **31 deprecated items** accumulated over several major versions. Some have been deprecated since v10 ("will be removed in v11.0.0"). Since v14 is still in beta, now is the ideal time to clean these up before stable release. All removals are breaking changes, but they're expected in a major version bump.

## Inventory

| #                                                          | Deprecated Item                          | Replacement                                 | Location                                                    | Status           |
| ---------------------------------------------------------- | ---------------------------------------- | ------------------------------------------- | ----------------------------------------------------------- | ---------------- |
| **Pin Permissions (7 items)**                              |                                          |                                             |                                                             |                  |
| 1                                                          | `pinPermissions` prop (MessageContext)   | `channelCapabilities`                       | `src/context/MessageContext.tsx`                            | ✅ Done          |
| 2                                                          | `pinPermissions` prop (MessageProps)     | `channelCapabilities`                       | `src/components/Message/types.ts`                           | ✅ Done          |
| 3                                                          | `pinPermissions` prop (MessageListProps) | `channelCapabilities`                       | `src/components/MessageList/MessageList.tsx`                | ✅ Done          |
| 4                                                          | `PinEnabledUserRoles` type               | `channelCapabilities`                       | `src/components/Message/hooks/usePinHandler.ts`             | ✅ Done          |
| 5                                                          | `PinPermissions` type                    | `channelCapabilities`                       | `src/components/Message/hooks/usePinHandler.ts`             | ✅ Done          |
| 6                                                          | `defaultPinPermissions` constant         | `channelCapabilities`                       | `src/components/Message/utils.tsx`                          | ✅ Done          |
| 7                                                          | `_permissions` param in `usePinHandler`  | `channelCapabilities`                       | `src/components/Message/hooks/usePinHandler.ts`             | ✅ Done          |
| **Pagination Renames (6 items, #1804)**                    |                                          |                                             |                                                             |                  |
| 8                                                          | `hasMore` prop (InfiniteScroll)          | `hasPreviousPage`                           | `src/components/InfiniteScrollPaginator/InfiniteScroll.tsx` | ✅ Done          |
| 9                                                          | `hasMoreNewer` prop (InfiniteScroll)     | `hasNextPage`                               | `src/components/InfiniteScrollPaginator/InfiniteScroll.tsx` | ✅ Done          |
| 10                                                         | `loadMore` prop (InfiniteScroll)         | `loadPreviousPage`                          | `src/components/InfiniteScrollPaginator/InfiniteScroll.tsx` | ✅ Done          |
| 11                                                         | `loadMoreNewer` prop (InfiniteScroll)    | `loadNextPage`                              | `src/components/InfiniteScrollPaginator/InfiniteScroll.tsx` | ✅ Done          |
| 12                                                         | `refreshing` prop (LoadMoreButton)       | `isLoading`                                 | `src/components/LoadMore/LoadMoreButton.tsx`                | ✅ Done          |
| 13                                                         | `refreshing` prop (PaginatorProps)       | `isLoading`                                 | `src/types/types.ts`                                        | ✅ Done          |
| **useUserRole (3 items)**                                  |                                          |                                             |                                                             |                  |
| 14                                                         | `isAdmin` return value                   | `channelCapabilities`                       | `src/components/Message/hooks/useUserRole.ts:13`            | Pending          |
| 15                                                         | `isOwner` return value                   | `channelCapabilities`                       | `src/components/Message/hooks/useUserRole.ts:20`            | Pending          |
| 16                                                         | `isModerator` return value               | `channelCapabilities`                       | `src/components/Message/hooks/useUserRole.ts:26`            | Pending          |
| **VirtualizedMessageList (4 items, deprecated since v10)** |                                          |                                             |                                                             |                  |
| 17                                                         | `defaultItemHeight` prop                 | `additionalVirtuosoProps.defaultItemHeight` | `VirtualizedMessageList.tsx:617`                            | Pending          |
| 18                                                         | `head` prop                              | `additionalVirtuosoProps.components.Header` | `VirtualizedMessageList.tsx:636`                            | Pending          |
| 19                                                         | `overscan` prop                          | `additionalVirtuosoProps.overscan`          | `VirtualizedMessageList.tsx:663`                            | Pending          |
| 20                                                         | `scrollSeekPlaceHolder` prop             | `additionalVirtuosoProps.scrollSeek*`       | `VirtualizedMessageList.tsx:675`                            | Pending          |
| **Other**                                                  |                                          |                                             |                                                             |                  |
| 21                                                         | `StreamEmoji` component                  | (none)                                      | `src/components/Reactions/StreamEmoji.tsx`                  | ✅ Done          |
| 22                                                         | `UploadButton` / `UploadButtonProps`     | `FileInput` / `FileInputProps`              | `src/components/ReactFileUtilities/UploadButton.tsx`        | ✅ Done          |
| 23                                                         | `moveChannelUp` utility                  | `moveChannelUpwards`                        | `src/components/ChannelList/utils.ts`                       | ✅ Done          |
| 24                                                         | `latestMessage` prop                     | `latestMessagePreview`                      | `src/components/ChannelListItem/ChannelListItem.tsx`        | ✅ Done          |
| 25                                                         | `total_unread_count` mock field          | `unread_count`                              | `src/mock-builders/event/notificationMarkUnread.ts`         | ✅ Done          |
| 26                                                         | `hasNotMoreMessages` function            | `hasMoreMessagesProbably`                   | `src/components/MessageList/utils.ts`                       | ✅ Done          |
| 27                                                         | `popperOptions` prop (EmojiPicker)       | `placement`                                 | `src/plugins/Emojis/EmojiPicker.tsx`                        | ✅ Done          |
| 28                                                         | `useActionHandler` string overload       | `FormData` object form                      | `src/components/Message/hooks/useActionHandler.ts:34`       | Pending          |
| 29                                                         | `formatDate` prop (MessageProps)         | (TBD)                                       | `src/components/Message/types.ts:29` (`// todo: remove`)    | Pending          |
| 30                                                         | `LegacyReactionOptions` array format     | Object format `{ quick: {...} }`            | `src/components/Reactions/reactionOptions.tsx:5`            | Needs discussion |
| 31                                                         | `LegacyThreadContext`                    | (internal plumbing, not public API)         | `src/components/Thread/LegacyThreadContext.ts`              | Needs discussion |

## Bug Fix (not a removal)

~~`MessageList.tsx:83` has a **wrong deprecation comment**: `loadMoreNewer` is labeled `@deprecated in favor of channelCapabilities` but it's a pagination callback, not related to capabilities. This comment was copy-pasted from pin permissions deprecation and should be removed.~~ ✅ Fixed

## Also addressed

- `deprecationAndReplacementWarning` utility deleted (zero callers remain after Batch 3)
- Tests updated: `InfiniteScroll.test.tsx`, `LoadMoreButton.test.tsx`, `LoadMorePaginator.test.tsx`
- Unused `fireEvent` import cleaned up in `InfiniteScroll.test.tsx`

## Remaining Work

### Batch 4 (remaining): useUserRole (items 14–16)

**Risk: Medium**

| Action                                                            | File                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Remove `isAdmin`, `isOwner`, `isModerator` computations + returns | `src/components/Message/hooks/useUserRole.ts`                 |
| Delete ~120 lines of tests for removed values                     | `src/components/Message/hooks/__tests__/useUserRole.test.tsx` |

### Batch 5: VirtualizedMessageList Props (items 17–20)

**Risk: Medium-High** — Deprecated since v10. The `head` prop needs care since it may affect thread rendering.

| Action                                                                  | File                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------- |
| Remove `defaultItemHeight` prop + Virtuoso spread                       | `src/components/MessageList/VirtualizedMessageList.tsx` |
| Remove `head` prop + rendering logic (verify thread headers still work) | `src/components/MessageList/VirtualizedMessageList.tsx` |
| Remove `overscan` prop + Virtuoso prop                                  | `src/components/MessageList/VirtualizedMessageList.tsx` |
| Remove `scrollSeekPlaceHolder` prop + Virtuoso config                   | `src/components/MessageList/VirtualizedMessageList.tsx` |

### Batch 6: Misc Cleanup (items 28, 29)

**Risk: Medium**

| Action                                                                                         | File                                                                |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Remove string overload branch (`typeof dataOrName === 'string'`)                               | `src/components/Message/hooks/useActionHandler.ts`                  |
| Update `ActionHandlerReturnType` to only accept `FormData`                                     | `src/components/Message/hooks/useActionHandler.ts`                  |
| Update tests if any use the string overload                                                    | `src/components/Message/hooks/__tests__/useActionHandler.test.tsx`  |
| Remove `formatDate` prop from `MessageProps` and `MessageContextValue` (has `// todo: remove`) | `src/components/Message/types.ts`, `src/context/MessageContext.tsx` |
| Remove `formatDate` pass-through in Message component and i18n integration                     | `src/i18n/utils.ts`, `src/i18n/types.ts`                            |
| **Note:** `DateSeparator.formatDate` is a separate prop and should be kept                     |                                                                     |

### Batch 7: Legacy Formats (items 30, 31) — Needs Discussion

**Risk: High** — These are not formally `@deprecated` but are named "Legacy" and have newer replacements. Removal is more invasive.

| Item                                 | Details                                                                                                                                                                                                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LegacyReactionOptions` array format | The `ReactionOptions` type is a union of `LegacyReactionOptions` (array) and the new object format. Removing the array branch requires updating `Array.isArray()` guards in `ReactionSelector.tsx`, `useProcessReactions.tsx`, `MessageReactionsDetail.tsx`, and tests. |
| `LegacyThreadContext`                | Internal compatibility bridge used in `Thread.tsx`, `useMessageComposerController.ts`, `useNotificationTarget.ts`, and tests. Named "Legacy" explicitly. Not a public API — removal depends on whether the new thread model fully replaces it.                          |

**Recommendation:** These warrant their own investigation before committing to removal in v14. They may be better suited for v15 unless the team confirms the newer alternatives fully cover all use cases.

## Items to NOT Remove

| Item                                                                                                  | Reason                                                                       |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `hasMore`/`hasMoreNewer`/`loadMore`/`loadMoreNewer` on **MessageList** and **VirtualizedMessageList** | NOT deprecated — canonical API from ChannelStateContext/ChannelActionContext |
| `_componentName` params on context hooks                                                              | Backward-compatible call-site markers, no benefit to removing                |

## Verification (per batch)

1. `yarn types` — No type errors from removed types/props
2. `yarn test` — Full test suite passes
3. `yarn build` — Build succeeds
4. `yarn lint-fix` — No lint issues
5. For Batch 5: manually verify thread rendering in the example app
