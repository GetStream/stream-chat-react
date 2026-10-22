import type { StreamChat } from 'stream-chat';

import { noteLiveEvent } from './live';
import { noteEvent, type TouchingEvent } from './renders';

// Recording and replay of the events the client receives, so a render count can be reproduced
// without a live backend storm (WEB-PLAN.md §5.7).
//
// Both sides go through `client.dispatchEvent`: stream-chat's WebSocket handler parses each frame
// and hands it to exactly that function (stream-chat 10.0.0-rc.22, WSConnection.onmessage), so a
// replayed payload takes the same path a live one does.
//
// A fixture refers to message ids of the dataset it was recorded on, and a re-seed issues new ids.
// Replay therefore refuses a fixture whose messages aren't loaded, instead of dispatching no-ops.

type ClientEvent = Parameters<StreamChat['dispatchEvent']>[0];

export type FixtureEvent = { dt: number; event: ClientEvent };

export type EventFixture = {
  version: 1;
  recordedAt: string;
  build: string;
  /** Channel the scenario had open, if any. */
  cid: string | null;
  durationMs: number;
  events: FixtureEvent[];
};

// Connection housekeeping: per-connection, carries no chat state, and replaying it would confuse the
// live connection the replay runs on.
const NOT_RECORDED = new Set(['connection.ok', 'connection.recovered', 'health.check']);

let client: StreamChat | undefined;
let recording: { cid: string | null; events: FixtureEvent[]; start: number } | null =
  null;
let replaying = false;

/** Wraps `client.dispatchEvent` once: every event feeds the render counter, live delivery, and the recorder. */
export const tapClientEvents = (target: StreamChat) => {
  if (client === target) return;
  client = target;
  const dispatch = target.dispatchEvent;
  target.dispatchEvent = (event) => {
    noteEvent(event as TouchingEvent);
    noteLiveEvent(event);
    if (recording && !replaying && !NOT_RECORDED.has(event.type)) {
      recording.events.push({
        dt: performance.now() - recording.start,
        event: structuredClone(event),
      });
    }
    dispatch(event);
  };
};

export const startRecording = (cid: string | null) => {
  recording = { cid, events: [], start: performance.now() };
};

export const stopRecording = (): EventFixture => {
  if (!recording) throw new Error('not recording');
  const { cid, events, start } = recording;
  recording = null;
  return {
    build: __PERF_BUILD__,
    cid,
    durationMs: performance.now() - start,
    events,
    recordedAt: new Date().toISOString(),
    version: 1,
  };
};

/** Message ids the fixture's events act on, that must already be loaded for a replay to mean anything. */
const referencedMessageIds = (fixture: EventFixture) => {
  const ids = new Set<string>();
  for (const { event } of fixture.events) {
    // A new message brings itself; anything else (reaction, update, delete) acts on an existing one.
    if (event.type === 'message.new' || event.type === 'notification.message_new')
      continue;
    const id = (event as TouchingEvent).message?.id;
    if (id) ids.add(id);
  }
  return ids;
};

const loadedMessageIds = (cid: string) => {
  const channel = client?.channelManager.get(cid);
  const items = (channel?.messagePaginator.state.getLatestValue().items ?? []) as Array<{
    id: string;
  }>;
  return new Set(items.map((m) => m.id));
};

/**
 * Dispatches the fixture's events in order, one every `intervalMs` (a fixed cadence, so the commit
 * pattern is the same on every run). Resolves when the last one has been dispatched.
 */
export const replay = async (
  fixture: EventFixture,
  { intervalMs }: { intervalMs: number },
) => {
  if (!client) throw new Error('no client yet');
  if (fixture.version !== 1)
    throw new Error(`unknown fixture version ${fixture.version}`);

  if (fixture.cid) {
    const loaded = loadedMessageIds(fixture.cid);
    const missing = [...referencedMessageIds(fixture)].filter((id) => !loaded.has(id));
    if (missing.length) {
      throw new Error(
        `fixture acts on ${missing.length} message(s) that are not loaded in ${fixture.cid} ` +
          `(e.g. ${missing[0]}): it was recorded on a different seed. Re-record it.`,
      );
    }
  }

  replaying = true;
  try {
    for (const { event } of fixture.events) {
      const copy = structuredClone(event) as ClientEvent & { received_at?: unknown };
      delete copy.received_at;
      client.dispatchEvent(copy);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  } finally {
    replaying = false;
  }
  return fixture.events.length;
};
