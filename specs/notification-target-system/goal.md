# Notification Target System

## Goal

Introduce a notification targeting system that lets SDK components emit notifications that are consumed by panel-specific `NotificationList` instances.

## Success Criteria

- Notifications can be targeted to one of the following panels: `channel`, `thread`, `channel-list`, `thread-list`.
- A reusable hook named `useNotificationTarget` is available and used instead of repeating local panel detection logic.
- `NotificationList` can consume notifications for a specific panel via shared targeting/filtering helpers.
- `NotificationList` supports queueing behavior when emitted notifications exceed the configured visible limit.
- Panel roots support rendering panel-scoped notification lists in:
  - `Channel.tsx`
  - `Thread.tsx`
  - `ChannelList.tsx`
  - `ThreadList.tsx`

## Constraints

- Preserve backward compatibility of existing notification manager behavior.
- Keep public API additions additive and typed.
- Keep styling and rendering conventions aligned with existing SDK patterns.

## Non-goals

- Replacing `stream-chat` `NotificationManager` internals.
- Redesigning notification visuals.
- Full migration of every notification emitter in the repository in this iteration.
