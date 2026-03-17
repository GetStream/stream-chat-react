import { useEffect, useRef } from 'react';
import type { ThreadManagerState } from 'stream-chat';
import {
  type ChatView as ChatViewType,
  useChatContext,
  useChatViewContext,
  useThreadsViewContext,
  useStateStore,
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
  const { activeChatView, setActiveChatView } = useChatViewContext();
  const { channel, client } = useChatContext();
  const previousSyncedChatView = useRef<ChatViewType | undefined>(undefined);
  const previousChannelId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (
      initialChatView &&
      previousSyncedChatView.current === undefined &&
      activeChatView !== initialChatView
    ) {
      setActiveChatView(initialChatView);
      return;
    }

    if (previousSyncedChatView.current === activeChatView) return;

    previousSyncedChatView.current = activeChatView;
    updateSelectedChatViewInUrl(activeChatView);
  }, [activeChatView, initialChatView, setActiveChatView]);

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

const threadManagerSelector = (nextValue: ThreadManagerState) => ({
  isLoading: nextValue.pagination.isLoading,
  ready: nextValue.ready,
  threads: nextValue.threads,
});

export const ThreadStateSync = () => {
  const selectedThreadId = useRef<string | undefined>(
    getSelectedThreadIdFromUrl() ?? undefined,
  );
  const { client } = useChatContext();
  const { activeThread, setActiveThread } = useThreadsViewContext();
  const { isLoading, ready, threads } = useStateStore(
    client.threads.state,
    threadManagerSelector,
  ) ?? {
    isLoading: false,
    ready: false,
    threads: [],
  };
  const isRestoringThread = useRef(false);
  const previousThreadId = useRef<string | undefined>(undefined);
  const attemptedThreadLookup = useRef(false);

  useEffect(() => {
    if (activeThread?.id) {
      selectedThreadId.current = activeThread.id;
      previousThreadId.current = activeThread.id;
      attemptedThreadLookup.current = false;
      updateSelectedThreadIdInUrl(activeThread.id);
      return;
    }

    if (!previousThreadId.current) return;

    selectedThreadId.current = undefined;
    previousThreadId.current = undefined;
    attemptedThreadLookup.current = false;
    updateSelectedThreadIdInUrl();
  }, [activeThread?.id]);

  useEffect(() => {
    const threadIdToRestore = selectedThreadId.current;

    if (!threadIdToRestore) return;

    if (activeThread?.id && activeThread.id !== threadIdToRestore) {
      return;
    }

    const matchingThreadFromList = threads.find(
      (thread) => thread.id === threadIdToRestore,
    );

    if (matchingThreadFromList && activeThread !== matchingThreadFromList) {
      setActiveThread(matchingThreadFromList);
      return;
    }

    if (
      matchingThreadFromList ||
      activeThread?.id === threadIdToRestore ||
      isRestoringThread.current ||
      attemptedThreadLookup.current ||
      isLoading ||
      !ready
    ) {
      return;
    }

    let cancelled = false;

    attemptedThreadLookup.current = true;
    isRestoringThread.current = true;

    client
      .getThread(threadIdToRestore)
      .then((thread) => {
        if (!thread || cancelled) return;

        setActiveThread(thread);
      })
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;

        isRestoringThread.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [activeThread, client, isLoading, ready, setActiveThread, threads]);

  return null;
};
