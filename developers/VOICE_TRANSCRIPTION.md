# Voice note transcription: build and architecture overview

Internal notes for bringing voice note transcripts to `stream-chat-js` (the LLC) and `stream-chat-react`. Not integrator-facing.

## 1. Status

| Part                                                                | State                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------ |
| Backend                                                             | Done and behind a per-app feature flag (CHA-5849, CHA-7173). |
| Design                                                              | In Review (DES-257).                                         |
| LLC types (`voice_transcript`, `voice_transcription`)               | Released in `stream-chat` 10.3.0.                            |
| LLC on-demand API (`transcribeMessage`, `transcribe-voice-message`) | On `stream-chat-js` `master` (#2044), not released.          |
| React: show the transcript text                                     | Implemented on `feat/voice-note-transcript` (phase 1).       |
| React: everything else in the design                                | Planned (phases 2 to 5).                                     |

## 2. Sources

- API docs: https://getstream.io/chat/docs/javascript/voice-transcription/
- Design: SDK Design System → Message Views → "Voice Message – Transcript" sections: https://www.figma.com/design/BJppI3JYlPy3XeEu5MZY1E/SDK-Design-System?node-id=29638-40122
- Tickets: DES-257 (design), CHA-5849 (backend), CHA-7173 (on demand), CHA-6828 (docs), IOS-2298 (iOS)

## 3. Backend contract

### Data

`voice_transcript` on a `voiceRecording` attachment (generated `AttachmentTranscriptResponse`):

| Field                            | Meaning                                                                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text?: string`                  | The transcript. Missing until transcribed, and when there was no speech.                                                                                  |
| `languages?: { code: string }[]` | Detected languages. Missing when unidentified.                                                                                                            |
| `error?: string`                 | Final failure: `unsupported_format`, `too_large`, `fetch_failed`, `blocked_url`, `invalid_response`, `provider_error`. Treat unknown values the same way. |

A missing `voice_transcript` means "not transcribed yet" or "transcription is off". The server does not tell the two apart.

### Flow

1. The client sends a message with a `voiceRecording` attachment that has an `asset_url`. Stream's SDKs already do this.
2. The message is delivered at once, without a transcript.
3. The server transcribes each recording, writes `voice_transcript` on the attachment and sends `message.updated` (no push notification). Thread replies are transcribed too.
4. Temporary failures are retried by the server. If the retries run out, the attachment keeps no `voice_transcript`.

Not transcribed: other attachment types, recordings without `asset_url`, channels with transcription off, deleted messages, and message types other than `regular` and `reply`.

Clients cannot write `voice_transcript`; the server ignores it. An edit that keeps the same file keeps the transcript; replacing the file transcribes the new one.

### Switches

- Per app: Stream enables the feature flag. Currently on europe-west4:c1, us-east4:sirius and us-east4:c4.
- Per channel type: `voice_transcription: true` (default `false`), set server-side with `updateChannelType`.
- Per channel: `config_overrides.voice_transcription` overrides the channel type in either direction.
- Turning it on does not transcribe older recordings. Turning it off stops pending ones.

### On demand

- `client.transcribeMessage({ id })` → `POST /api/v2/chat/messages/{id}/transcribe`, returns `{ duration }`. Generated in `src/gen/chat/ChatApi.ts`; `StreamChat` extends `ChatApi`.
- Works without the channel's `voice_transcription` setting.
- Gated by the own capability `transcribe-voice-message` (`ChannelOwnCapability.TRANSCRIBE_VOICE_MESSAGE`).
- The result arrives the same way: `message.updated` with `voice_transcript`.

### Limits

- 25 MiB per recording.
- Formats: AAC (Stream SDK voice notes), M4A, MP4, MP3, WAV, WebM, OGG, FLAC.
- Language is detected automatically. Supported: af, ar, hy, az, be, bg, ca, zh, cs, da, nl, en, et, tl, fi, fr, gl, de, el, hi, hu, id, it, ja, ko, lv, lt, mk, no, fa, pl, pt, ro, ru, sr, sk, sl, es, sv, th, tr, uk, vi. Others are best effort.
- Usage is billed as `transcription_seconds`, rounded up per recording.

## 4. Design spec

All sections are drawn with the mobile components. On the web, the "sheet" is a modal.

| Section            | Spec                                                                                                                                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transcript         | Under the player, inside the same bubble. Header: sparkle icon, **Transcript**, chevron on the right. With a transcript the player's bottom padding is 2 instead of 8. Collapsed clamps the text to 3 lines; tapping the header expands it in place. The chevron is hidden when the text fits in 3 lines. It shows automatically once it arrives. |
| States             | Pending: muted, shimmering "Transcribing…", only in channels with transcription on. Failed: muted "Transcript unavailable", final, no retry. No transcript (e.g. older messages): no block.                                                                                                                                                       |
| Caption            | Player and transcript share the tinted container; the caption stays below it. The transcript text is smaller than the caption.                                                                                                                                                                                                                    |
| Long transcript    | Expanded stops at 12 lines; longer transcripts show a "View full transcript" link that opens the full text in a sheet.                                                                                                                                                                                                                            |
| Language           | Optional "Transcribed in English" line below the text, above "View full transcript".                                                                                                                                                                                                                                                              |
| Request transcript | Without a transcript, "✦ Transcribe" requests one; while the request runs it shows "Transcribing…".                                                                                                                                                                                                                                               |

## 5. Architecture

### 5.1 Data flow

```
                         server
                           │  message.updated (attachment.voice_transcript)
                           ▼
 LLC   Channel._handleChannelEvent ── 'message.updated'
         ├─ messagePaginator.ingestItem(message)          (channel list)
         ├─ thread messagePaginator (via client.threads)  (thread replies)
         └─ voiceTranscriptionRequests.reflectMessage()   (phase 4: clears a pending request)

       channel.configState ── voiceTranscription.enabled   (phase 3)
       channel.state       ── ownCapabilities              (phase 4: transcribe-voice-message)
       client.transcribeMessage({ id })                    (phase 4)
                           │
                           ▼  useStateStore(store, selector)
 React MessageList → Message → Attachment → AttachmentContainer → VoiceRecordingContainer
         → VoiceRecording → VoiceRecordingPlayer
              ├─ VoiceRecordingPlayerUI        (play, waveform, speed)
              └─ VoiceRecordingTranscript      (ComponentContext slot, null turns it off)
                    └─ status → text | pending | unavailable | transcribe button | nothing
```

The paginators already re-emit the updated message, so the attachment re-renders with its transcript without new event code in React.

### 5.2 Ownership

| Concern                              | LLC                                                                                                | React                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Transcript data and its types        | Generated `Attachment.voice_transcript`                                                            | Reads it from the attachment          |
| Is transcription on for this channel | `ChannelConfig.voiceTranscription.enabled` (server-owned, from `serverConfig.voice_transcription`) | Reads `channel.configState`           |
| Can the user request one             | `channel.state.ownCapabilities`                                                                    | Reads it with a selector              |
| Request and its pending state        | `transcribeMessage` + a request store per channel                                                  | Calls the store, renders its state    |
| What to show                         | Pure `getVoiceTranscriptStatus()`                                                                  | Maps the status to a view             |
| Errors of a request                  | `client.notifications.addError` with a typed notification                                          | Translator for that notification type |
| Layout, clamping, modal, a11y        |                                                                                                    | All of it                             |

Keeping the request state in the LLC lets it survive virtualized rows remounting, and React Native gets the same behaviour.

### 5.3 LLC (`stream-chat-js`)

| File                                                       | Change                                                                                                                                                                                                                                                     | Phase        |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `src/gen/*`                                                | `transcribeMessage`, `TranscribeMessageResponse`, `TRANSCRIBE_VOICE_MESSAGE` (already on `master`, #2044)                                                                                                                                                  | release only |
| `src/voiceTranscription/constants.ts`                      | `VoiceTranscriptError` and `VoiceTranscriptStatus` const objects with same-named types                                                                                                                                                                     | 3            |
| `src/voiceTranscription/utils/getVoiceTranscriptStatus.ts` | `({ attachment, autoTranscriptionEnabled, isRequested, canRequest, isRecent }) → VoiceTranscriptStatus`                                                                                                                                                    | 3            |
| `src/channel.ts`                                           | `ChannelConfig.voiceTranscription: { enabled }`, assigned in `applyAuthority` next to `markTypes` from `serverConfig.voice_transcription`; the integrator cannot set it                                                                                    | 3            |
| `src/voiceTranscription/VoiceTranscriptionRequests.ts`     | `StateStore<{ requestedMessageIds: string[] }>`; `request(messageId)` calls `client.transcribeMessage`, `reflectMessage(message)` clears an id once its recordings carry `voice_transcript`; a failed request clears the id and adds an error notification | 4            |
| `src/channel.ts`                                           | `channel.voiceTranscriptionRequests`; the `message.updated` case calls `reflectMessage`                                                                                                                                                                    | 4            |
| `src/notifications`                                        | Notification type for a failed request, e.g. `api:message:transcribe:failed`                                                                                                                                                                               | 4            |
| `src/index.ts`                                             | Export the constants, the util and the store type                                                                                                                                                                                                          | 3, 4         |

Statuses: `transcribed`, `pending`, `unavailable`, `requestable`, `none`.

```
voice_transcript.text                                  → transcribed
voice_transcript.error                                 → unavailable
requested on demand and still waiting                  → pending
auto transcription on and the message is recent        → pending
no transcript and the user has transcribe-voice-message → requestable
otherwise                                              → none
```

To check in the LLC:

- `channelServerConfigs[cid]` must reflect `config_overrides`; otherwise the per-channel override is invisible to the client.
- `messageComposer.ts` (`subscribeMessageUpdated`) calls `initState({ composition: event.message })` when the updated message is the one being edited. A transcript landing mid-edit must not wipe the edit.

### 5.4 React (`stream-chat-react`)

Target layout once phases 2 to 5 land (phase 1 is a single file):

```
src/components/Attachment/VoiceRecordingTranscript/
├── VoiceRecordingTranscript.tsx      # picks the view for the status
├── TranscriptContent.tsx             # header button, text, language line, "View full transcript"
├── TranscriptPending.tsx             # "Transcribing…" with shimmer
├── TranscriptUnavailable.tsx
├── TranscribeButton.tsx
├── FullTranscriptViewer.tsx          # Modal slot + Dialog Viewer
├── hooks/
│   ├── useVoiceTranscriptStatus.ts   # configState + ownCapabilities + request store → status
│   ├── useTranscribeVoiceMessage.ts
│   └── useLineClampOverflow.ts       # ResizeObserver: does the text overflow 3 / 12 lines
├── utils/transcriptLanguageLabel.ts  # code → "English" via Intl.DisplayNames, falls back to the code
├── constants.ts                      # COLLAPSED_LINES = 3, EXPANDED_LINES = 12, RECENT_MESSAGE_WINDOW_MS
├── types.ts
├── styling/index.scss
├── __tests__/
└── index.ts
```

Integration points:

- `VoiceRecordingPlayer` (`src/components/Attachment/VoiceRecording.tsx`) renders the slot under `VoiceRecordingPlayerUI`, inside the attachment container, which gives the tinted background from the design. Quoted messages do not render it.
- `ComponentContext.VoiceRecordingTranscript?: ComponentType<VoiceRecordingTranscriptProps> | null`.
- Icons: add `IconSparkles` to `DEFAULT_ICONS` (SVG exported from Figma); `IconChevronDown` and `IconChevronUp` exist.
- Styles: muted text uses `--str-chat__text-secondary`, links and the button `--str-chat__accent-primary`, the shimmer stops under `prefers-reduced-motion`. The player's bottom padding drops to `--str-chat__spacing-xxxs` through `:has(+ transcript)`, so the player needs no prop.
- i18n (`attachment.voiceRecording.transcript.*`): `title`, `pending.text`, `unavailable.text`, `transcribe.label`, `viewFull.label`, `language.text` ("Transcribed in {{ language }}"), `expand.ariaLabel`, `collapse.ariaLabel`. Plus a translator for the failed-request notification in `src/i18n/TranslationBuilder/notifications/`.
- Accessibility: the header is a `<button aria-expanded aria-controls>`; the play button gets `aria-describedby` pointing at the transcript; a transcript the user requested is announced through the aria-live announcer.

Not in the design, so unchanged: quoted messages, the channel list preview, the composer.

## 6. Phase 1, implemented

Branch `feat/voice-note-transcript` (from `master`):

| File                                                                               | Change                                                                                                                        |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Attachment/VoiceRecordingTranscript.tsx`                           | New. Renders the "Transcript" title and `voice_transcript.text`; nothing without `text` (not transcribed, failed, no speech). |
| `src/components/Attachment/VoiceRecording.tsx`                                     | `VoiceRecordingPlayer` renders the slot under the player.                                                                     |
| `src/context/ComponentContext.tsx`                                                 | `VoiceRecordingTranscript` slot, `null` turns it off.                                                                         |
| `src/components/Attachment/index.ts`                                               | Exports the component and its props type.                                                                                     |
| `src/components/Attachment/styling/VoiceRecording.scss`                            | Transcript styles; player bottom padding when a transcript follows.                                                           |
| `src/i18n/keys.ts`, `src/i18n/__tests__/catalog.fixture.json`                      | Regenerated for `attachment.voiceRecording.transcript.title`.                                                                 |
| `__tests__/VoiceRecordingTranscript.test.tsx`, `__tests__/VoiceRecording.test.tsx` | States, placement, quoted message, custom slot, `null` slot, axe.                                                             |

Known gaps: no sparkle icon (the Figma SVG is not exported yet) and not checked against a live app.

## 7. Build, dependencies and release

### Dependency chain

```
stream-chat 10.3.0  ── voice_transcript types ──► React phase 1–3
stream-chat next    ── transcribeMessage (#2044) + phase 3/4 LLC work ──► React phase 3–4
```

- `stream-chat-react` `master` locks `stream-chat` 10.2.0 (`package.json` `^10.2.0`), which has no `voice_transcript`. Phase 1 type-checks only against 10.3.x.
- Moving to 10.3.x on `master` breaks `yarn types` until `translatorsByNotificationType` covers the scheduled-message notification types that 10.3.0 added. `feat/scheduled-messages-lean` does both (bumps to `^10.3.1` and adds the translators).
- So phase 1 merges after `feat/scheduled-messages-lean`, or stacks on it. Do not duplicate the bump.
- Phases 3 and 4 need an LLC release containing #2044 and the LLC work above (a `feat` commit, so semantic-release cuts the next minor), then a `stream-chat` bump in React `package.json` (`peerDependencies` and `devDependencies`).

### Local development against an unreleased LLC

1. In `stream-chat-js`: `yarn build` (or `yarn start` to watch).
2. In `stream-chat-react`: `rm -rf node_modules/stream-chat && ln -s ../../stream-chat-js node_modules/stream-chat`. `yarn install` undoes it.
3. Dedupe `@stream-io/state-store`: replace `stream-chat-js/node_modules/@stream-io/state-store` with a symlink to `stream-chat-react/node_modules/@stream-io/state-store`; otherwise `yarn types` fails with hundreds of TS2769 errors.
4. `examples/vite` reads `STREAM_CHAT_JS_PATH` from `examples/vite/.env.local`; run `yarn build` in React before `yarn start:vite`.

### Trying it against the backend

1. Ask the backend team (CHA-7173) to enable the feature flag for the test app; it must live in one of the enabled regions.
2. Server-side: `client.chat.updateChannelType({ name: 'messaging', voice_transcription: true })`, or per channel `channel.updateChannelPartial({ set: { config_overrides: { voice_transcription: true } } })`.
3. Record a voice note in `examples/vite`; the transcript appears a few seconds after sending.

### Gates

| Repo  | Commands                                                                                                                                                                                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LLC   | `yarn types`, `yarn lint`, `yarn test-unit`, `yarn build`                                                                                                                                                                                                         |
| React | `yarn lint`, `yarn types`, `yarn types:scripts`, `yarn test`, `yarn build-translations` (commit `keys.ts`), `yarn validate-translations` (passes only once `keys.ts` is committed), `yarn build`, `yarn validate-cjs`, `yarn validate-esm`, `yarn examples:build` |

## 8. Delivery plan

| Phase | Repo        | Scope                                                                                                                                                                            | Depends on                                              |
| ----- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1     | React       | Show the transcript text under the player, slot, styles, i18n, tests. **Done.**                                                                                                  | `stream-chat` ≥ 10.3.0 (`feat/scheduled-messages-lean`) |
| 2     | React       | Design polish without LLC changes: sparkle icon, 3-line clamp with chevron, 12-line cap + "View full transcript" modal, language line, `aria-describedby`, caption sizing check. | Phase 1, Figma SVG                                      |
| 3     | LLC → React | `ChannelConfig.voiceTranscription`, `VoiceTranscriptError` / `VoiceTranscriptStatus`, `getVoiceTranscriptStatus`; React pending ("Transcribing…") and unavailable states.        | LLC release                                             |
| 4     | LLC → React | `VoiceTranscriptionRequests` store, failed-request notification; React "Transcribe" button, capability check, notification translator, arrival announcement.                     | LLC release with #2044                                  |
| 5     | React       | Docs page for React, `examples/vite` toggle, cookbook recipe if wanted.                                                                                                          | Phases 1–4                                              |

Each phase ships tests in the matching `__tests__/` folder: pure utils with unit tests, hooks, components with an axe check, and a test that `message.updated` turns pending into transcribed.

## 9. Open questions

1. **Pending vs. older messages.** The server never says a transcript is on its way. With transcription on, a message without a transcript may be pending or older than the setting. Proposal: pending only for messages younger than `RECENT_MESSAGE_WINDOW_MS`. Does "Transcribe" also show in channels with automatic transcription on?
2. **Per message vs. per attachment.** `transcribeMessage` takes a message id; the design says "this audio attachment". What happens with several recordings in one message?
3. **`audio` attachments.** Can plain audio files be transcribed on demand, or only `voiceRecording`?
4. **No speech.** `voice_transcript` with neither `text` nor `error` has no designed state. Phase 1 renders nothing.
5. **Several detected languages.** Which one does "Transcribed in …" show?
6. **Web frames.** The design uses mobile components; confirm the modal and click targets for the web on DES-257.
7. **Per-channel override visibility.** Does `channelServerConfigs[cid]` include `config_overrides`?
8. **Edit while a transcript arrives.** See the composer check in 5.3.
9. **Error list drift.** The docs list `provider_error`; the generated type comment does not.

## 10. Risks

- A "pending" heuristic that guesses wrong shows "Transcribing…" forever or hides a real pending state. Keep it in one pure util so it is easy to change.
- Virtualized lists remount rows; any pending or expanded state kept in React state resets. Request state lives in the LLC; expanded state may reset, which is acceptable.
- Clamp detection depends on layout; `useLineClampOverflow` must clean up its ResizeObserver and avoid re-render loops.
- Bumping `stream-chat` pulls in unrelated LLC changes; land the bump with the branch that already handles them.
