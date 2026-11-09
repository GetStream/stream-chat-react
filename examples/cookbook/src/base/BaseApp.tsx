import { Fragment, useEffect, useMemo } from 'react';
import { ChannelPaginator } from 'stream-chat';
import type { SortParamRequest } from 'stream-chat';
import {
  ChannelHeader,
  ChannelNavigation,
  Chat,
  MessageComposer,
  MessageList,
  ThreadHeader,
  useCreateChatClient,
  useThreadContext,
} from 'stream-chat-react';
import {
  ChannelSlot,
  ChatView,
  ThreadSlot,
  useActiveThread,
} from 'stream-chat-react/slot-layout';
import type { LayoutDescriptor } from 'stream-chat-react/slot-layout';
import { apiKey, channelFilters, currentUser, tokenProvider } from './client';
import { OpenFromUrl } from './OpenFromUrl';
import { makeReadOnly } from './readOnly';
import type { RecipeConfig } from './recipe';
import { createDemoSearchController } from './searchController';
import { SIDE_PANEL_SLOT, SidePanel, SidePanelProvider } from './SidePanel';
import { Simulate } from './Simulate';

const sort: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];

// The channel, a thread opened from it, then the side panel recipes open their content in.
const defaultLayouts: LayoutDescriptor[] = [
  { id: 'channels', slots: ['channel', 'thread', SIDE_PANEL_SLOT] },
];

// The base layouts with the recipe's: one with the same id replaces the base one, a new id is added.
const mergeLayouts = (base: LayoutDescriptor[], added: LayoutDescriptor[] = []) => [
  ...base.map((layout) => added.find(({ id }) => id === layout.id) ?? layout),
  ...added.filter(({ id }) => !base.some((layout) => layout.id === id)),
];

// Marks the open thread as on screen, so its new replies are marked read.
const ActiveThread = () => {
  const thread = useThreadContext();
  useActiveThread({ activeThread: thread });
  return null;
};

/**
 * The app every recipe starts from: `Chat`, `ChatView` with the channel list, the open channel, a
 * thread beside it and the side panel after them, in the SDK's default theme. A recipe changes it
 * through `RecipeConfig`.
 */
export const BaseApp = ({ recipe }: { recipe: RecipeConfig }) => {
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: currentUser,
  });

  // Nothing a visitor clicks in the cookbook changes the shared demo app.
  useEffect(() => (client ? makeReadOnly(client) : undefined), [client]);

  useEffect(() => {
    if (!client || recipe.registerChannelPaginator === false) return;
    const paginator = new ChannelPaginator({
      client,
      filters: channelFilters,
      id: 'cookbook',
      // Presence keeps members' online status current, which several recipes show.
      requestOptions: { presence: true, state: true },
      sort,
    });
    client.channelManager.insertPaginator({ paginator });
    return () => {
      client.channelManager.removePaginator(paginator);
    };
  }, [client, recipe]);

  const chatProps = useMemo(
    () =>
      client
        ? {
            searchController: createDemoSearchController(client),
            ...recipe.chatProps?.(client),
          }
        : {},
    [client, recipe],
  );

  if (!client) return <div className='str-chat cookbook-status'>Connecting…</div>;

  const RecipeChannelHeader = recipe.ChannelHeader ?? ChannelHeader;
  const RecipeChannelNavigation = recipe.ChannelNavigation ?? ChannelNavigation;
  const RecipeMessageList = recipe.MessageList ?? MessageList;
  const Wrapper = recipe.Wrapper ?? Fragment;

  const defaultChannelsView = (
    <>
      <RecipeChannelNavigation />
      <ChannelSlot slot='channel'>
        <RecipeChannelHeader />
        <RecipeMessageList />
        <MessageComposer />
      </ChannelSlot>
      <ThreadSlot slot='thread'>
        <ActiveThread />
        <ThreadHeader />
        <RecipeMessageList />
        <MessageComposer />
      </ThreadSlot>
      <SidePanel {...recipe.sidePanelProps} />
    </>
  );

  return (
    <div className='cookbook-frame'>
      <Chat {...chatProps} client={client} theme={recipe.theme}>
        <SidePanelProvider>
          <Wrapper>
            <ChatView
              {...recipe.chatViewProps}
              layouts={
                recipe.chatViewProps?.layouts ??
                mergeLayouts(defaultLayouts, recipe.layouts)
              }
              views={
                recipe.chatViewProps?.views ?? {
                  channels: defaultChannelsView,
                  ...recipe.views,
                }
              }
            >
              {recipe.openFromUrl !== false && <OpenFromUrl />}
              <Simulate />
              {recipe.chatViewChildren}
            </ChatView>
          </Wrapper>
        </SidePanelProvider>
      </Chat>
    </div>
  );
};
