# Instance configuration in React

`client.config` configures instances the SDK creates for you — channels, threads, message composers,
and the client's own managers. It lives on the `stream-chat` client, so it is available to a React app
without any component API.

The full reference is in the `stream-chat` package: [instance
configuration](https://github.com/GetStream/stream-chat-js/blob/master/docs/instance-configuration.md).
This page covers what is React-specific: where to put the call, what it unlocks that component props
never could, and how to read the resolved values from a component.

## Where to put it

Register configuration where you create the client — module scope, not inside a component:

```tsx
// client.ts
import { StreamChat } from 'stream-chat';

export const chatClient = StreamChat.getInstance(import.meta.env.VITE_STREAM_KEY);

chatClient.config.set({
  channel: {
    messagePaginator: { pageSize: 50, stateThrottleMs: 250 },
  },
  messageComposer: {
    drafts: { enabled: true },
  },
});
```

```tsx
// App.tsx
import { Chat, Channel, MessageList, MessageInput } from 'stream-chat-react';
import { chatClient } from './client';

export const App = () => (
  <Chat client={chatClient}>
    <Channel channel={channel}>
      <MessageList />
      <MessageInput />
    </Channel>
  </Chat>
);
```

**Not in an effect.** Some configuration is read once when an instance is constructed, and channels
are constructed by `client.channel()` / `client.queryChannels()` — which an app typically calls before
or during the same commit that mounts `<Chat>`. Registering from `useEffect` runs after that, so those
values would arrive too late for instances that already exist.

**There is deliberately no `<Chat>` prop for this.** Binding registration to a component's lifecycle
would recreate exactly that ordering problem, and would give you two places where configuration can
come from. The client is already the object you hold outside React.

## What this unlocks

These were not reachable from the React SDK at all before — there was no prop, and no way to set a
default for channels the SDK creates:

```ts
chatClient.config.set({
  // Applies to every message list — the channel's and every thread's.
  messagePaginator: {
    stateThrottleMs: 250, // how often a list re-renders under a burst of events
    retryCount: 2, // retries per failed page request
    lockItemOrder: true, // keep a visible message's position when it updates
  },
  channel: {
    messagePaginator: { pageSize: 50 }, // channel messages per page
    pinnedMessagesPaginator: { pageSize: 25 },
  },
  thread: {
    messagePaginator: { pageSize: 25 }, // thread replies per page
  },
  client: {
    notifications: { durations: { error: 10_000 } },
    reminders: { scheduledOffsetsMs: [5 * 60_000, 60 * 60_000] },
    // Batching of read/delivery receipts — previously hardcoded in the LLC.
    messageDelivery: { markAsReadThrottleTimeoutMs: 2000 },
  },
});
```

Feature gates are configurable too. Each is combined with the channel type's server flag, so either side
can switch a feature off:

```ts
chatClient.config.set({
  channel: {
    typingEvents: { enabled: false }, // with `typing_events`
    readEvents: { enabled: false }, // with `read_events`
    replies: { enabled: false }, // with `replies`
    userMessageReminders: { enabled: false }, // with `user_message_reminders`
    deliveryEvents: { enabled: false }, // with `delivery_events`
  },
  messageComposer: {
    attachments: { enabled: false }, // with `uploads`
    polls: { enabled: false }, // with `polls`
    location: { enabled: false }, // with `shared_locations`
    linkPreviews: { enabled: false }, // with `url_enrichment`
  },
});
```

Set `messageComposer.attachments.customCdn: true` if a custom `doUploadRequest` stores files outside
Stream — that tells the SDK its `uploads` flag and `upload-file` capability do not apply.

A few settings that used to be LLC constants are now paths here too:
`messageOperations.failedSendCacheTtlMs` (how long a failed send stays retryable — a shared key, since
messages are sent from channels _and_ threads, with `channel.messageOperations` /
`thread.messageOperations` overriding it per parent),
`client.threads.connectionRecoveryThrottleMs`, and
`messageComposer.location.minShareDurationMs`. Use `chatClient.config.getTree()` to see everything you
have registered, without needing to know the key names up front.

The top-level `messagePaginator` key exists because one `MessagePaginator` class backs both the channel
list and thread replies, and settings like throttling have no reason to differ between them. `pageSize`
does differ, so the per-parent slices override the shared one field by field.

### `pageSize` is not `channelQueryOptions.messages.limit`

`<Channel channelQueryOptions={{ messages: { limit: 30 } }}>` sizes the **initial** channel query
(`Channel.tsx`). The paginator's `pageSize` sizes **every subsequent page** — what a scroll-up fetches.
They are different numbers and you usually want both:

```tsx
chatClient.config.set({ channel: { messagePaginator: { pageSize: 50 } } });

<Channel channel={channel} channelQueryOptions={{ messages: { limit: 30 } }}>
  …
</Channel>;
```

## Setup functions, for behaviour

Values go in `set`. Reach for a setup function when what you want to change is behaviour — middleware,
comparators, a replaced request implementation:

```ts
chatClient.config.setSetupFunction('messageComposer', ({ composer }) => {
  composer.updateConfig({ text: { maxLengthOnSend: 500 } });
  return () => composer.updateConfig({ text: { maxLengthOnSend: undefined } });
});
```

This replaces the older `client.setMessageComposerSetupFunction(fn)`, which is deprecated in the LLC. It
still works — it shipped in v9, so customer code may rely on it — but nothing in this repo uses it any
more, and new code should not:

```ts
// deprecated
chatClient.setMessageComposerSetupFunction(({ composer }) => {
  /* … */
});

// current
chatClient.config.setSetupFunction('messageComposer', ({ composer }) => {
  /* … */
});
```

The type aliases `MessageComposerSetupFunction`, `MessageComposerSetupState` and
`MessageComposerTearDownFunction` went further — they are **removed**, not deprecated, because they were
never exported from the package root and so no supported import could break. Use
`InstanceSetupFunction<'messageComposer'>`, `InstanceSetupState<'messageComposer'>` and
`InstanceSetupTearDownFunction`.

A setup function is also the right place for anything you want to survive a `client.config.reset()`:
reset re-derives configuration and re-runs setup functions, but it discards imperative
`composer.updateConfig(...)` calls made outside one.

## Request handlers

Register them through `client.config`. The `doSendMessageRequest`, `doUpdateMessageRequest`,
`doDeleteMessageRequest` and `doMarkReadRequest` props on `<Channel>` and `<Thread>` are **removed** —
see the v14 → v15 migration guide.

```ts
// centrally, for every channel
chatClient.config.set({
  channel: {
    requestHandlers: {
      sendMessageRequest: async ({ message, options }) => {
        const { message: sent } = await sendViaProxy(message, options);
        return { message: sent };
      },
    },
  },
});
```

Thread-scoped requests go under the `thread` key with the same shape.

Registration is per **client**, not per mounted subtree, which is the one thing the props could do that
this cannot. If behaviour has to differ between channels, branch inside a single handler on the
`channel` or `cid` it receives:

```ts
sendMessageRequest: async ({ localMessage, message, options }) => {
  const channel = chatClient.channel(...);
  return isSupportChannel(localMessage.cid)
    ? { message: await sendViaProxy(message, options) }
    : { message: await sendNormally(message, options) };
},
```

Why the props went: they and `client.config` wrote to the same slot, so the SDK carried a coordinator
that tracked which mounted component owned each handler, restored the previous owner on unmount, and
re-applied everything whenever the LLC re-derived. All of it existed to reconcile two ways of doing one
thing. With one owner there is nothing to arbitrate.

## Reading effective configuration

Composer configuration is a reactive store, so components can subscribe to it:

```tsx
import { useStateStore } from 'stream-chat-react';

const DraftsIndicator = ({ composer }: { composer: MessageComposer }) => {
  const { enabled } = useStateStore(composer.configState, (state) => ({
    enabled: state.drafts.enabled,
  }));

  return enabled ? <span>Drafts on</span> : null;
};
```

Paginator configuration is reactive too, so the same hook works on it:

```tsx
const { pageSize } = useStateStore(channel.messagePaginator.configState, (config) => ({
  pageSize: config.pageSize,
}));
```

`Channel` and `Thread` expose the same shape as every other configurable class — `configState` for the store and `config` for the current value. `Channel` used to stop at `configState`, because
`channel.getConfig()` meant the channel type's _server_ configuration and a sibling `config` would have
read as the same thing. That method is now `channel.serverConfig`, which says what it returns, so the
collision is gone.

`config` is `Readonly`, so assigning to a field of it is a compile error — it returns the store's live
object, and the write would change state without re-rendering anything. Note that `Readonly` is shallow:
a nested write such as `composer.config.text.publishTypingEvents = false` still compiles, and you must
not do it. Reach for `updateConfig()` in every case.

Some features are also gated by the server, and **the resolved configuration already accounts for it**.
`channel.config.typingEvents.enabled` is the channel type's `typing_events` already ANDed with what you
registered; the same holds for `readEvents`, `replies`, `userMessageReminders`, `deliveryEvents`, and the
composer's `attachments`, `polls`, `location` and `linkPreviews`.

So read the resolved value, never the raw flag. `channel.serverConfig?.typing_events` answers only the
server's half, and a UI gating on it will offer features the client has already disabled. Client
configuration can narrow what the server allows, never widen it — the `stream-chat` doc's _server has the
last word_ section has the full rules.
