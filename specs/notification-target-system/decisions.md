# Decisions

## 2026-03-12 - Feature scope and naming

- Use `useNotificationTarget` as the canonical hook name for panel targeting.
- Treat `channel`, `thread`, `channel-list`, `thread-list` as first-class notification panel targets.
- Keep NotificationManager behavior unchanged; implement targeting/queueing at consumer hook + UI layer.

## 2026-03-12 - Target fallback behavior

- Notifications without `origin.context.panel` are treated as `channel` by default in panel matching helpers.
- This keeps backward compatibility for existing emitters while enabling strict panel routing for new emitters.

## 2026-03-12 - Queueing approach

- Queueing is implemented at notification consumer level via `useQueuedNotifications`.
- `NotificationList` renders only the visible window (`maxVisibleCount`) while preserving overflow in queue.

## 2026-03-12 - Panel mount strategy

- Panel-scoped `NotificationList` instances are mounted at panel roots (`Channel`, `Thread`, `ChannelList`, `ThreadList`).
- Legacy `MessageListNotifications` no longer renders the unscoped client notification list to avoid duplicates.

## 2026-03-12 - Emitter migration scope

- Migrated panel detection in key emitters (`Message`, `MessageInput`, `useAudioController`, `ShareLocationDialog`, `Channel jumpToFirstUnread`) to use `useNotificationTarget`.
- Kept emitter IDs and options semantics intact while standardizing `origin.context.panel` generation.

## 2026-03-12 - Notification target tags

- Added `tags?: string[]` to `stream-chat-js` notification model/options and propagated through `NotificationManager`.
- `stream-chat-react` now assigns `target:<panel>` tags internally for notification emissions, while still keeping `origin.context.panel`.
- Panel resolution now prioritizes target tags and falls back to `origin.context.panel` for backward compatibility.

## 2026-03-12 - Naming cleanup

- Introduced `NotificationTargetPanel` as the primary panel target type.
- Kept `NotificationOriginPanel` and related helper aliases as deprecated compatibility exports.

## 2026-03-12 - Notification translation optimization

- Replaced per-file default notification translator functions with a single generic type-aware translator in NotificationTranslationTopic.
- Added explicit handling for notification types emitted from both stream-chat-js and stream-chat-react that were previously not translated.
- Kept custom translator registration override semantics: exact type translators still take precedence over fallback translator.
