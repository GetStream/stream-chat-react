import { useEffect, useRef } from 'react';
import {
  type ChatView as ChatViewType,
  useChatContext,
  useChatViewContext,
  useChatViewNavigation,
  useLayoutViewState,
  useSlotChannels,
  useSlotThreads,
} from 'stream-chat-react';

const selectedChannelUrlParam = 'channel';
const selectedChatViewUrlParam = 'view';
const selectedThreadUrlParam = 'thread';

export const getSelectedChannelIdFromUrl = () =>
  new URLSearchParams(window.location.search).get(selectedChannelUrlParam);

export const getSelectedChatViewFromUrl = (): ChatViewType | undefined => {
  const selectedChatView = new URLSearchParams(window.location.search).get(
    selectedChatViewUrlParam,
  );

  if (selectedChatView === 'threads') return 'threads';
  if (selectedChatView === 'channels' || selectedChatView === 'chat') return 'channels';

  return undefined;
};

const getSelectedThreadIdFromUrl = () =>
  new URLSearchParams(window.location.search).get(selectedThreadUrlParam);

const updateSelectedChannelIdInUrl = (channelId?: string) => {
  const url = new URL(window.location.href);

  if (channelId) {
    url.searchParams.set(selectedChannelUrlParam, channelId);
  } else {
    url.searchParams.delete(selectedChannelUrlParam);
  }

  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
};

const updateSelectedChatViewInUrl = (chatView: ChatViewType) => {
  const url = new URL(window.location.href);

  url.searchParams.set(
    selectedChatViewUrlParam,
    chatView === 'threads' ? 'threads' : 'chat',
  );

  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
};

const updateSelectedThreadIdInUrl = (threadId?: string) => {
  const url = new URL(window.location.href);

  if (threadId) {
    url.searchParams.set(selectedThreadUrlParam, threadId);
  } else {
    url.searchParams.delete(selectedThreadUrlParam);
  }

  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
};

export const ChatStateSync = ({
  initialChatView,
}: {
  initialChatView?: ChatViewType;
}) => {
  const { activeChatView, setActiveView } = useChatViewContext();
  const { client } = useChatContext();
  const { open } = useChatViewNavigation();
  // Single-panel app: sync the primary (first) open channel slot to the URL. Read the
  // *channels* view specifically (not the active view) so the `?channel=` param is
  // retained while the threads view is focused — the channels layout keeps its binding.
  const channel = useSlotChannels({ view: 'channels' })[0]?.channel;
  const previousSyncedChatView = useRef<ChatViewType | undefined>(undefined);
  const previousChannelId = useRef<string | undefined>(undefined);
  const restoredChannelFromUrl = useRef(false);

  // Restore the active channel from the `?channel=` URL param on mount (previously
  // done by the legacy ChannelList's `customActiveChannel`; the channel list is now
  // orchestrator-driven, so URL restore is handled here — display flows through the
  // channel slot bound by `open`).
  useEffect(() => {
    if (restoredChannelFromUrl.current || channel) return;
    const channelIdFromUrl = getSelectedChannelIdFromUrl();
    if (!channelIdFromUrl) return;
    restoredChannelFromUrl.current = true;

    // NB: no cancel-on-cleanup guard — under StrictMode the simulated unmount would
    // otherwise cancel this restore while the ref already blocks the re-run. `open`
    // targets the (always-mounted) layout slot state, so a late call is safe.
    void (async () => {
      let target = Object.values(client.activeChannels).find(
        (candidate) => candidate.id === channelIdFromUrl,
      );
      if (!target) {
        [target] = await client.queryChannels({ id: channelIdFromUrl });
      }
      if (target) open({ key: target.cid ?? undefined, kind: 'channel', source: target });
    })();
  }, [channel, client, open]);

  useEffect(() => {
    if (
      initialChatView &&
      previousSyncedChatView.current === undefined &&
      activeChatView !== initialChatView
    ) {
      setActiveView(initialChatView);
      return;
    }

    if (previousSyncedChatView.current === activeChatView) return;

    previousSyncedChatView.current = activeChatView;
    updateSelectedChatViewInUrl(activeChatView);
  }, [activeChatView, initialChatView, setActiveView]);

  useEffect(() => {
    if (channel?.id) {
      previousChannelId.current = channel.id;
      updateSelectedChannelIdInUrl(channel.id);
      return;
    }

    if (!previousChannelId.current) return;

    previousChannelId.current = undefined;
    updateSelectedChannelIdInUrl();
  }, [channel?.id]);

  // @ts-expect-error expose client and channel for debugging purposes
  window.client = client;
  // @ts-expect-error expose client and channel for debugging purposes
  window.channel = channel;
  return null;
};

export const ThreadStateSync = () => {
  const initialThreadId = useRef<string | undefined>(
    getSelectedThreadIdFromUrl() ?? undefined,
  );
  const { client } = useChatContext();
  const { open } = useChatViewNavigation();
  const { availableSlots } = useLayoutViewState();
  // Single-panel app: the primary (first) thread slot drives the URL. A multi-panel
  // app would sync differently (e.g. a focused slot).
  const activeThread = useSlotThreads()[0]?.thread;
  const previousThreadId = useRef<string | undefined>(undefined);
  const restoredThreadFromUrl = useRef(false);

  // Restore the thread from the `?thread=` URL param, binding it into the primary
  // thread slot once the threads layout exposes one. Mirrors ChatStateSync's channel
  // restore — no cancel-on-cleanup guard so StrictMode's simulated unmount can't abort
  // the async restore (the ref already blocks the re-run; `open` targets slot state).
  useEffect(() => {
    if (restoredThreadFromUrl.current || activeThread) return;
    const threadIdFromUrl = initialThreadId.current;
    if (!threadIdFromUrl) return;
    if (!availableSlots.includes('main-thread')) return;
    restoredThreadFromUrl.current = true;

    void (async () => {
      const thread = await client.getThread(threadIdFromUrl).catch(() => undefined);
      if (!thread) return;
      open(
        { key: thread.id ?? undefined, kind: 'thread', source: thread },
        { slot: 'main-thread' },
      );
    })();
  }, [activeThread, availableSlots, client, open]);

  // Keep the URL in sync with the primary thread slot.
  useEffect(() => {
    if (activeThread?.id) {
      previousThreadId.current = activeThread.id;
      updateSelectedThreadIdInUrl(activeThread.id);
      return;
    }

    if (!previousThreadId.current) return;

    previousThreadId.current = undefined;
    updateSelectedThreadIdInUrl();
  }, [activeThread?.id]);

  return null;
};
