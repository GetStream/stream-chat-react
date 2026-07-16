import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useChatContext, useStateStore } from 'stream-chat-react';
import {
  type ChatView,
  type ChatViewEntityBinding,
  type ChatViewLayoutState,
  createChatViewSlotBinding,
  getChatViewEntityBinding,
  type SlotName,
  useChatViewContext,
  useChatViewNavigation,
} from 'stream-chat-react/slot-layout';
import type {
  Channel,
  ChannelPaginatorsOrchestrator,
  StreamChat,
  Thread,
} from 'stream-chat';

/**
 * Full-workspace URL sync for the vite example.
 *
 * Encodes the entire layout reference — active view → each populated slot → that slot's base binding
 * and its layer stack — into a single readable `?workspace=` param, and restores it on load. This is
 * the "URL as the navigation reference" idea: the param captures *what is open where*, by entity key,
 * not the runtime UI state (scroll, drafts, mounted-underneath) which stays in the LayoutController.
 *
 * Grammar (`;`-separated segments; first segment is the active view):
 *   workspace = <activeView> ";" <slotEntry> ( ";" <slotEntry> )*
 *   slotEntry = <view> "/" <slot> "=" <token> ( "|" <token> )*     // token[0] = base, rest = layers (bottom→top)
 *   token     = <kind> ":" encodeURIComponent(<key>)               // channel→cid, thread→id, userProfile→userId
 *
 * Example:
 *   ?workspace=channels;channels/main-channel=channel:messaging%3Ageneral;
 *              channels/channel-thread=thread:t_abc|userProfile:u42;threads/main-thread=thread:t_xyz
 *
 * Known limitations (see the architecture discussion):
 *   - Persistent list kinds (channelList/threadList) are seeded by the layout, not encoded.
 *   - Layers are ephemeral by design; `userProfile` overlays are included here for demonstration —
 *     drop them from `RECONSTRUCTABLE_KINDS` if you'd rather they not be shareable.
 *   - Restore is best-effort + async (channels/threads are re-resolved by key); unresolved entries
 *     are skipped. Runtime state under a layer is NOT restored (only the navigational reference is).
 *   - The active view is always recorded (even with no slots — e.g. an empty threads view is
 *     `workspace=threads`). The initial write replaces in place; every later change pushes an entry,
 *     so browser Back/Forward step through the workspace history. Back/Forward re-restore IN PLACE
 *     (no page reload) and resolve entities paginator-first, so stepping through visited workspaces
 *     fetches nothing — only entities not yet in a paginator are queried.
 */

const WORKSPACE_PARAM = 'workspace';

// Rule (#2): encode a binding only if it can be *reconstructed from a stable entity id* on restore.
// This set is the registry of such kinds — each must also appear in `keyForBinding` (id → token) and
// `resolveBinding` (token → live entity). Persistent seeds (channelList/threadList) have no such id,
// so they are absent here and never enter the URL. Add a new kind here + in those two functions.
const RECONSTRUCTABLE_KINDS = new Set<ChatViewEntityBinding['kind']>([
  'channel',
  'thread',
  'userProfile',
]);

/** Stable id used as the URL key for a binding's entity. */
const keyForBinding = (binding: ChatViewEntityBinding): string | undefined => {
  switch (binding.kind) {
    case 'channel':
      return (binding.source as Channel).cid ?? undefined;
    case 'thread':
      return (binding.source as Thread).id ?? undefined;
    case 'userProfile':
      return (binding.source as { userId?: string }).userId ?? undefined;
    default:
      return undefined;
  }
};

const tokenForBinding = (
  binding: ChatViewEntityBinding | undefined,
): string | undefined => {
  if (!binding || !RECONSTRUCTABLE_KINDS.has(binding.kind)) return undefined;
  const key = keyForBinding(binding);
  return key ? `${binding.kind}:${encodeURIComponent(key)}` : undefined;
};

// ---- encode: layout state → `workspace` string --------------------------------------------------

export const encodeWorkspace = (state: ChatViewLayoutState): string => {
  const segments: string[] = [state.activeView];

  for (const [view, runtime] of Object.entries(state.layouts ?? {})) {
    if (!runtime) continue;
    const slots = runtime.slotNames ?? runtime.availableSlots;
    for (const slot of slots) {
      const base = getChatViewEntityBinding(runtime.slotBindings?.[slot]);
      const layers = (runtime.slotLayers?.[slot] ?? [])
        .map((b) => tokenForBinding(getChatViewEntityBinding(b)))
        .filter((t): t is string => !!t);
      const baseToken = tokenForBinding(base);
      // A slot is worth encoding only if it has a base binding (layers ride on a base).
      if (!baseToken) continue;
      segments.push(`${view}/${slot}=${[baseToken, ...layers].join('|')}`);
    }
  }

  return segments.join(';');
};

// ---- parse: `workspace` string → structured plan ------------------------------------------------

type ParsedToken = { kind: ChatViewEntityBinding['kind']; key: string };
type ParsedSlot = {
  base: ParsedToken;
  layers: ParsedToken[];
  slot: SlotName;
  view: ChatView;
};
type ParsedWorkspace = { activeView: ChatView; slots: ParsedSlot[] };

const parseToken = (token: string): ParsedToken | undefined => {
  const colon = token.indexOf(':');
  if (colon < 0) return undefined;
  const kind = token.slice(0, colon) as ChatViewEntityBinding['kind'];
  const key = decodeURIComponent(token.slice(colon + 1));
  if (!RECONSTRUCTABLE_KINDS.has(kind) || !key) return undefined;
  return { key, kind };
};

const parseWorkspace = (raw: string | null): ParsedWorkspace | undefined => {
  if (!raw) return undefined;
  const [activeView, ...slotSegments] = raw.split(';');
  if (activeView !== 'channels' && activeView !== 'threads') return undefined;

  const slots: ParsedSlot[] = [];
  for (const segment of slotSegments) {
    const eq = segment.indexOf('=');
    if (eq < 0) continue;
    const [view, slot] = segment.slice(0, eq).split('/') as [ChatView, SlotName];
    const tokens = segment
      .slice(eq + 1)
      .split('|')
      .map(parseToken)
      .filter(Boolean) as ParsedToken[];
    if (!view || !slot || !tokens.length) continue;
    const [base, ...layers] = tokens;
    slots.push({ base, layers, slot, view });
  }

  return { activeView, slots };
};

export const getWorkspaceFromUrl = () =>
  parseWorkspace(new URLSearchParams(window.location.search).get(WORKSPACE_PARAM));

// Synchronous "peek" helpers for first-render layout heuristics (sidebar open?, which view?), read
// before the async restore runs. They pull the coarse answers out of the same `?workspace=` param
// that previously lived in the separate `?channel=`/`?thread=`/`?view=` params.

export const getInitialChatViewFromUrl = (): ChatView | undefined =>
  getWorkspaceFromUrl()?.activeView;

/** Primary channel's id (not cid) — matches the value the old `?channel=` param stored. */
export const getInitialChannelIdFromUrl = (): string | undefined => {
  const cid = getWorkspaceFromUrl()?.slots.find((s) => s.base.kind === 'channel')?.base
    .key;
  return cid ? cid.slice(cid.indexOf(':') + 1) : undefined;
};

export const getInitialThreadIdFromUrl = (): string | undefined =>
  getWorkspaceFromUrl()?.slots.find((s) => s.base.kind === 'thread')?.base.key;

const writeWorkspaceToUrl = (encoded: string, mode: 'push' | 'replace') => {
  const url = new URL(window.location.href);
  // Always record the active view — `encoded` starts with it, so an empty threads view still yields
  // `workspace=threads`. (The active view is part of the workspace state.)
  url.searchParams.set(WORKSPACE_PARAM, encoded);
  const next = `${url.pathname}${url.search}${url.hash}`;
  // `replace` establishes the param on the initial load without a spurious entry; `push` makes every
  // later change its own entry, so Back/Forward step through the workspace history consistently.
  if (mode === 'push') window.history.pushState(window.history.state, '', next);
  else window.history.replaceState(window.history.state, '', next);
};

// ---- resolve: token → live binding (async) ------------------------------------------------------

// `client.channel(type, id)` returns the client's cached instance for that cid (the same one the
// channel-list query watches). When the caller has already waited for the list to settle (see
// `waitForChannelList`), that instance is `initialized`, so the bound `<Channel>` skips its own watch
// — no duplicate `/query`. A channel absent from every loaded page is returned unwatched and
// `<Channel>` watches it (the necessary, non-redundant fetch).
const resolveChannel = (client: StreamChat, cid: string): Channel | undefined => {
  const existing = Object.values(client.activeChannels).find((c) => c.cid === cid);
  if (existing) return existing;
  const colon = cid.indexOf(':');
  const type = cid.slice(0, colon);
  const id = cid.slice(colon + 1);
  return type && id ? client.channel(type, id) : undefined;
};

const resolveBinding = async (
  client: StreamChat,
  token: ParsedToken,
): Promise<{ binding: ChatViewEntityBinding; channel?: Channel } | undefined> => {
  switch (token.kind) {
    case 'channel': {
      const channel = resolveChannel(client, token.key);
      if (!channel) return undefined;
      // A channel absent from every loaded page is an unwatched stub — its `state.members`,
      // `membership`, mute status etc. aren't loaded yet. Ownership resolution (`sideloadChannel`
      // → `matchesFilter`) reads exactly that state, so sideloading now would only match the
      // empty-filter fallback list (`channels:opened`), never `channels:default`. Watch first so
      // the channel is classified into its real owning list. Already-initialized channels
      // (paginator-first / warm Back-Forward) skip this — and this is the same single watch
      // `<Channel>` would otherwise issue, just moved earlier, so it stays a single `/query`.
      if (!channel.initialized) await channel.watch().catch(() => undefined);
      return { binding: { key: channel.cid, kind: 'channel', source: channel }, channel };
    }
    case 'thread': {
      // Paginator-first: a thread the thread-list already holds is reused as-is — no round-trip.
      // Only when it isn't loaded (deep-link straight to a thread past page 1, or a cold Back into a
      // never-visited thread) do we fall back to fetching it by id.
      const thread =
        client.threads.threadsById[token.key] ??
        (await client.getThread(token.key).catch(() => undefined));
      if (!thread) return undefined;
      return {
        binding: { key: thread.id ?? undefined, kind: 'thread', source: thread },
        channel: thread.channel ?? undefined,
      };
    }
    case 'userProfile':
      return {
        binding: { key: token.key, kind: 'userProfile', source: { userId: token.key } },
      };
    default:
      return undefined;
  }
};

// ---- readiness: wait for the list paginators before binding (cold-load de-duplication) ----------
//
// On a COLD load the restore runs before the channel-list / thread-list paginators have fetched their
// first page, so their stores are empty. Binding entities right then makes each `<Channel>` issue its
// OWN `/query` watch and each thread need a `getThread` — duplicating what the list queries
// (`/channels`, `/threads`) fetch a moment later. Waiting for the relevant list to settle first means
// a listed channel is already `initialized` (so `<Channel>` skips its watch) and a listed thread is
// already in `threadsById` (so no `getThread`). Entities genuinely absent from the loaded pages still
// fall back to an explicit query. Warm Back/Forward keeps the paginators populated, so these waits
// resolve on the first (immediate) subscribe callback — no added latency.

type MinimalStore<T> = {
  getLatestValue: () => T;
  subscribe: (handler: (value: T) => void) => () => void;
};

/**
 * Resolve when `predicate(state)` holds — checked on the immediate subscribe callback and every
 * change after — or after `timeoutMs` (so a list that never loads can't hang the restore).
 */
const waitForState = <T,>(
  store: MinimalStore<T>,
  predicate: (value: T) => boolean,
  timeoutMs = 4000,
): Promise<void> =>
  new Promise((resolve) => {
    let settled = false;
    // No-op until the real unsubscribe is assigned. This matters because StateStore.subscribe fires
    // the handler *synchronously* during the subscribe() call: on the warm/already-ready path
    // `finish` runs before `store.subscribe(...)` returns, so we can't rely on the assignment below
    // having happened yet. The trailing `if (settled) unsubscribe()` cleans up that case.
    let unsubscribe = () => undefined as void;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    unsubscribe = store.subscribe((value) => {
      if (predicate(value)) finish();
    });
    if (settled) unsubscribe();
  });

/** Wait for the channel-list paginator(s) to load their first page (so listed channels are watched). */
const waitForChannelList = async (orchestrator: ChannelPaginatorsOrchestrator) => {
  await waitForState(orchestrator.state, (s) => s.paginators.length > 0);
  const paginator = orchestrator.paginators[0];
  if (!paginator) return;
  await waitForState(paginator.state, (s) => s.items !== undefined);
};

/** Wait for the thread-list paginator to be ready (so listed threads are in `threadsById`). */
const waitForThreadList = (client: StreamChat) =>
  waitForState(client.threads.state, (s) => s.ready);

// ---- the sync component -------------------------------------------------------------------------

const workspaceEncodedSelector = (state: ChatViewLayoutState) => ({
  encoded: encodeWorkspace(state),
});

/**
 * Full-workspace URL sync (drop-in for the ad-hoc `ChatStateSync`/`ThreadStateSync`). Mount once
 * inside `<ChatView>`. Restore lifecycle:
 *   1. read the active view from `?workspace=` (synchronous);
 *   2. switch to it *before first paint* (useLayoutEffect) — no channels-view flash;
 *   3. wait for the active view's list paginators to settle, then reuse the entities they already
 *      loaded (no duplicate per-entity query) and fetch only the ones absent from the loaded pages;
 *   4. write the bindings + layers into the controller in ONE atomic state update.
 * Afterwards it keeps the `?workspace=` param in sync with every layout change.
 */
export const WorkspaceUrlSync = () => {
  const { channelPaginatorsOrchestrator, client } = useChatContext();
  const { layoutController } = useChatViewContext();
  const { openView } = useChatViewNavigation();

  const parsed = useMemo(() => getWorkspaceFromUrl(), []);
  const restoredOnce = useRef(false);
  // Suppress the URL writer until the restore has settled, so it can't clobber the param we're
  // still reading from.
  const restoringRef = useRef(!!parsed?.slots.length);

  const { encoded } = useStateStore(layoutController.state, workspaceEncodedSelector) ?? {
    encoded: '',
  };

  // Resolve a parsed workspace by entity id and apply it to the controller in ONE atomic write.
  //
  // Resolution is paginator-first (see `resolveBinding`): channels come from `client.activeChannels`
  // and threads from `client.threads.threadsById`, both populated by the list paginators. Entities
  // already paginated are reused with NO network round-trip — so navigating Back/Forward between
  // already-visited workspaces (which keeps those paginators warm, unlike a reload) fetches nothing.
  //
  // The write is a full reconcile, not a merge: reconstructable slots (channel/thread/userProfile)
  // absent from the target are cleared, so a Back/Forward that *removes* a slot actually empties it.
  // Persistent seeds (channelList/threadList) aren't reconstructable and are left untouched.
  const applyWorkspace = useCallback(
    async (target: ParsedWorkspace) => {
      // Cold-load de-duplication: before binding, wait for the list paginators whose entities will
      // actually mount (only the *active* view's slots render). Then a listed channel is already
      // watched and a listed thread already in `threadsById`, so resolution reuses them instead of
      // issuing a duplicate per-entity query. Warm Back/Forward resolves these waits immediately.
      const activeKinds = new Set(
        target.slots
          .filter((s) => s.view === target.activeView)
          .flatMap((s) => [s.base.kind, ...s.layers.map((l) => l.kind)]),
      );
      await Promise.all([
        activeKinds.has('channel')
          ? waitForChannelList(channelPaginatorsOrchestrator)
          : undefined,
        activeKinds.has('thread') ? waitForThreadList(client) : undefined,
      ]);

      // Resolve first (async) — no layout mutation yet, so nothing renders half-restored.
      const resolved = await Promise.all(
        target.slots.map(async (entry) => {
          const base = await resolveBinding(client, entry.base);
          if (!base) return undefined;
          if (base.channel) channelPaginatorsOrchestrator.sideloadChannel(base.channel);
          const layers: ChatViewEntityBinding[] = [];
          for (const layerToken of entry.layers) {
            const layer = await resolveBinding(client, layerToken);
            if (!layer) continue;
            if (layer.channel)
              channelPaginatorsOrchestrator.sideloadChannel(layer.channel);
            layers.push(layer.binding);
          }
          return { base: base.binding, layers, slot: entry.slot, view: entry.view };
        }),
      );

      // Group resolved targets by view → slot for the reconcile below.
      const targetsByView = new Map<
        ChatView,
        Map<SlotName, { base: ChatViewEntityBinding; layers: ChatViewEntityBinding[] }>
      >();
      for (const item of resolved) {
        if (!item) continue;
        if (!targetsByView.has(item.view)) targetsByView.set(item.view, new Map());
        targetsByView
          .get(item.view)!
          .set(item.slot, { base: item.base, layers: item.layers });
      }

      // One atomic update — reconcile every view's slots to the target and set the active view. No
      // intermediate view switches (unlike replaying open()), so no flash, and each binding lands
      // exactly as a normal open would render it.
      const noTargets: Map<
        SlotName,
        { base: ChatViewEntityBinding; layers: ChatViewEntityBinding[] }
      > = new Map();
      layoutController.state.next((current) => {
        const layouts = { ...current.layouts };
        for (const view of Object.keys(layouts) as ChatView[]) {
          const runtime = layouts[view];
          if (!runtime) continue;
          const targets = targetsByView.get(view) ?? noTargets;
          const slotBindings = { ...runtime.slotBindings };
          const slotLayers = { ...runtime.slotLayers };

          // Clear reconstructable slots absent from the target (persistent seeds stay put).
          for (const slot of Object.keys(slotBindings) as SlotName[]) {
            if (targets.has(slot)) continue;
            const binding = getChatViewEntityBinding(slotBindings[slot]);
            if (binding && RECONSTRUCTABLE_KINDS.has(binding.kind)) {
              delete slotBindings[slot];
              delete slotLayers[slot];
            }
          }
          // Apply the target bindings + layers.
          for (const [slot, { base, layers }] of targets) {
            slotBindings[slot] = createChatViewSlotBinding(base);
            if (layers.length)
              slotLayers[slot] = layers.map((b) => createChatViewSlotBinding(b));
            else delete slotLayers[slot];
          }

          layouts[view] = { ...runtime, slotBindings, slotLayers };
        }
        return { ...current, activeView: target.activeView, layouts };
      });
    },
    [channelPaginatorsOrchestrator, client, layoutController],
  );

  // (1)+(2) Go straight to the active view before the browser paints — the channels view never shows.
  useLayoutEffect(() => {
    if (parsed) openView(parsed.activeView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (4) Initial restore: resolve every referenced entity and place them in one atomic write.
  useEffect(() => {
    if (restoredOnce.current) return;
    restoredOnce.current = true;
    if (!parsed?.slots.length) {
      restoringRef.current = false;
      return;
    }
    void applyWorkspace(parsed).finally(() => {
      restoringRef.current = false;
    });
  }, [applyWorkspace, parsed]);

  // Keep the URL in sync with the live layout — only once restore has settled.
  useEffect(() => {
    if (restoringRef.current) return;
    const currentParam =
      new URLSearchParams(window.location.search).get(WORKSPACE_PARAM) ?? '';
    // No real change (e.g. the write immediately after a restore matches the URL) → no new entry.
    if (encoded === currentParam) return;
    // Establish the param in place on the initial load (no param yet); push a new entry for every
    // subsequent change so browser Back returns to the previous workspace.
    writeWorkspaceToUrl(encoded, currentParam === '' ? 'replace' : 'push');
  }, [encoded]);

  // Back/Forward: the URL changed to a previously-pushed workspace. Re-restore IN PLACE (no reload)
  // so the warm paginators are reused — resolution finds the already-loaded channels/threads and
  // fetches nothing. `applyWorkspace` clears slots absent from the target, so stepping back to a
  // smaller workspace correctly empties the extra slots.
  useEffect(() => {
    const onPopState = () => {
      const target = getWorkspaceFromUrl();
      if (!target) return;
      restoringRef.current = true;
      void applyWorkspace(target).finally(() => {
        restoringRef.current = false;
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyWorkspace]);

  return null;
};
