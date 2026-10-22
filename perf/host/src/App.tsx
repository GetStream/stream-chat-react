import { useEffect, useState } from 'react';
import type { ChannelFilters, SortParamRequest, StreamChat } from 'stream-chat';
import { ChannelPaginator } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelNavigation,
  Chat,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
  useCreateChatClient,
  VirtualizedMessageList,
  WithComponents,
} from 'stream-chat-react';
import {
  ChatView,
  type ChatViewSlotRenderers,
  Slot,
} from 'stream-chat-react/slot-layout';

import { setChannelState } from './channels';
import type { PerfHostConfig } from './config';
import { dropEvents, tapClientEvents } from './events';
import { installLeak } from './leaks';
import { GroundTruthMessageUI } from './groundTruth';
import { enableGroundTruth } from './renders';
import { trackChannelListReady } from './marks';
import { setMessagesClient } from './messages';
import { NavigationBridge } from './navigation';
import { flushLongTasks, observeClient } from './observers';

// A deliberately boring chat page: SDK defaults only, one channel list, no customisation. Whatever
// it measures should be the SDK, not this app (WEB-PLAN.md §5.2).

const sort: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];

// Hard-coded in VirtualizedMessageList (`increaseViewportBy`, `overscan` default). Not settable from
// here; logged so every run records what it ran with (WEB-SCENARIOS.md §1.2b).
const SDK_VIRTUOSO_DEFAULTS = {
  increaseViewportBy: { bottom: 200, top: 0 },
  overscan: 0,
};

// Stable identity: a new overrides object every render would re-render every consumer.
const groundTruthOverrides = { MessageUI: GroundTruthMessageUI };

const chatViewLayouts = [{ id: 'channels' as const, slots: ['left', 'right'] }];

const createSlotRenderers = (config: PerfHostConfig): ChatViewSlotRenderers => {
  const List = config.list === 'virtualized' ? VirtualizedMessageList : MessageList;
  return {
    channel: ({ source }) => (
      <Channel channel={source}>
        <ChannelHeader />
        <List />
        <MessageComposer />
      </Channel>
    ),
    thread: ({ source }) => (
      <Thread thread={source}>
        <ThreadHeader />
        <List />
        <MessageComposer />
      </Thread>
    ),
  };
};

const Workspace = () => (
  <>
    <NavigationBridge />
    <ChannelNavigation />
    <div className='perf-host__slots'>
      <Slot slot='left' />
      <Slot slot='right' />
    </div>
  </>
);

type PerfHostHandle = {
  build: string;
  client: StreamChat;
  config: PerfHostConfig;
  /** The effective config of a loaded channel's message paginator (cap, throttle, page size). */
  paginatorConfig: (cid: string) => unknown;
};

declare global {
  interface Window {
    /** Debug handle for setup and checks, never read inside a measured window. */
    __perfHost?: PerfHostHandle;
  }
}

const findChannel = (client: StreamChat, cid: string) =>
  [...client.channelManager.values()].find((channel) => channel.cid === cid);

export const App = ({ config }: { config: PerfHostConfig }) => {
  const client = useCreateChatClient({
    apiKey: config.apiKey,
    tokenOrProvider: config.token,
    userData: { id: config.userId },
  });
  const [ready, setReady] = useState(false);
  const [slotRenderers] = useState(() => createSlotRenderers(config));

  useEffect(() => {
    if (!client) return;

    // The cap has to be registered before any message paginator derives its configuration, so
    // <Chat> is not rendered until it is (WEB-SCENARIOS.md §1.2b: 230 on livestream, unset on
    // messaging). It applies to every message paginator; one run renders one channel type.
    if (config.cap !== 'none') {
      client.config.setConfig('messagePaginator', { maxLoadedItems: config.cap });
    }

    const filters: ChannelFilters = {
      members: { $in: [config.userId] },
      type: config.type,
    };
    const paginator = new ChannelPaginator({
      client,
      filters,
      id: 'channels:perf',
      paginatorOptions: { pageSize: config.pageSize },
      sort,
    });
    client.channelManager.insertPaginator({ paginator });
    const cancelReadyTracker = trackChannelListReady(paginator, flushLongTasks);
    const stopObservingClient = observeClient(client);
    tapClientEvents(client);
    setMessagesClient(client);
    setChannelState(client, paginator);
    if (config.groundTruth) enableGroundTruth();
    if (config.leak) installLeak(config.leak, client);
    dropEvents(config.dropEvents);

    window.__perfHost = {
      build: __PERF_BUILD__,
      client,
      config,
      paginatorConfig: (cid) => findChannel(client, cid)?.messagePaginator.config,
    };

    console.info('[perf-host] settings', {
      build: __PERF_BUILD__,
      list: config.list,
      type: config.type,
      cap: config.cap,
      capIsCanonical: config.capIsCanonical,
      channelPageSize: config.pageSize,
      messagePaginatorConfig: client.config.getConfig('messagePaginator') ?? {},
      virtuoso: SDK_VIRTUOSO_DEFAULTS,
      strictMode: import.meta.env.DEV,
      ...(config.leak ? { VALIDATION_leak: config.leak } : {}),
      ...(config.dropEvents.length ? { VALIDATION_dropEvents: config.dropEvents } : {}),
    });
    setReady(true);

    return () => {
      cancelReadyTracker();
      stopObservingClient();
      client.channelManager.removePaginator(paginator);
      setReady(false);
    };
  }, [client, config]);

  const chatView = (
    <ChatView
      layouts={chatViewLayouts}
      slotRenderers={slotRenderers}
      views={{ channels: <Workspace /> }}
    />
  );

  if (!client || !ready) return <div className='perf-host__loading'>Connecting…</div>;

  return (
    <Chat client={client}>
      {config.groundTruth ? (
        <WithComponents overrides={groundTruthOverrides}>{chatView}</WithComponents>
      ) : (
        chatView
      )}
    </Chat>
  );
};
