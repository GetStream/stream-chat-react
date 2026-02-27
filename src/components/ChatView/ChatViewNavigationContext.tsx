import React, { createContext, useContext, useMemo } from 'react';

import { useStateStore } from '../../store';
import {
  createChatViewSlotBinding,
  getChatViewEntityBinding,
  useChatViewContext,
} from './ChatView';

import type { PropsWithChildren } from 'react';
import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { ChatView, ChatViewEntityBinding } from './ChatView';
import type {
  ChatViewLayoutState,
  LayoutSlot,
  OpenResult,
} from './layoutController/layoutControllerTypes';

export type ChatViewNavigation = {
  closeChannel: (options?: { slot?: LayoutSlot }) => void;
  closeThread: (options?: { slot?: LayoutSlot }) => void;
  hideChannelList: (options?: { slot?: LayoutSlot }) => void;
  openChannel: (channel: StreamChannel, options?: { slot?: LayoutSlot }) => OpenResult;
  openThread: (thread: StreamThread, options?: { slot?: LayoutSlot }) => OpenResult;
  openView: (view: ChatView, options?: { slot?: LayoutSlot }) => void;
  unhideChannelList: (options?: { slot?: LayoutSlot }) => void;
};

const chatViewNavigationStateSelector = ({
  activeSlot,
  activeView,
  slotBindings,
  visibleSlots,
}: ChatViewLayoutState) => ({
  activeSlot,
  activeView,
  slotBindings,
  visibleSlots,
});

const ChatViewNavigationContext = createContext<ChatViewNavigation>({
  closeChannel: () => undefined,
  closeThread: () => undefined,
  hideChannelList: () => undefined,
  openChannel: () => ({ reason: 'no-available-slot', status: 'rejected' }),
  openThread: () => ({ reason: 'no-available-slot', status: 'rejected' }),
  openView: () => undefined,
  unhideChannelList: () => undefined,
});

export const useChatViewNavigation = () => useContext(ChatViewNavigationContext);

export const ChatViewNavigationProvider = ({ children }: PropsWithChildren) => {
  const { layoutController } = useChatViewContext();
  const { activeSlot, activeView, slotBindings, visibleSlots } =
    useStateStore(layoutController.state, chatViewNavigationStateSelector) ??
    chatViewNavigationStateSelector(layoutController.state.getLatestValue());

  const value = useMemo<ChatViewNavigation>(() => {
    const findSlotByKind = (kind: ChatViewEntityBinding['kind']) =>
      visibleSlots.find(
        (slot) => getChatViewEntityBinding(slotBindings[slot])?.kind === kind,
      );
    const resolveSlot = (slot?: LayoutSlot) => slot ?? activeSlot;

    const openView: ChatViewNavigation['openView'] = (view, options) => {
      layoutController.openView(view, { slot: options?.slot });
    };

    const openChannel: ChatViewNavigation['openChannel'] = (channel, options) => {
      openView('channels', options);

      return layoutController.open(
        createChatViewSlotBinding({
          key: channel.cid ?? undefined,
          kind: 'channel',
          source: channel,
        }),
        {
          targetSlot: options?.slot,
        },
      );
    };

    const closeChannel: ChatViewNavigation['closeChannel'] = (options) => {
      const targetSlot = options?.slot ?? findSlotByKind('channel') ?? activeSlot;
      if (!targetSlot) return;
      layoutController.close(targetSlot);
    };

    const openThread: ChatViewNavigation['openThread'] = (thread, options) => {
      openView('threads', options);

      return layoutController.open(
        createChatViewSlotBinding({
          key: thread.id ?? undefined,
          kind: 'thread',
          source: thread,
        }),
        {
          targetSlot: options?.slot,
        },
      );
    };

    const closeThread: ChatViewNavigation['closeThread'] = (options) => {
      const targetSlot = options?.slot ?? findSlotByKind('thread') ?? activeSlot;
      if (!targetSlot) return;
      layoutController.close(targetSlot);
    };

    const hideChannelList: ChatViewNavigation['hideChannelList'] = (options) => {
      const targetSlot = resolveSlot(options?.slot) ?? findSlotByKind('channelList');
      if (targetSlot) {
        layoutController.setSlotHidden(targetSlot, true);
      }
      layoutController.setEntityListPaneOpen(false);
    };

    const unhideChannelList: ChatViewNavigation['unhideChannelList'] = (options) => {
      const existingChannelListSlot = findSlotByKind('channelList');
      const targetSlot = resolveSlot(options?.slot) ?? existingChannelListSlot;

      if (targetSlot) {
        if (!existingChannelListSlot) {
          layoutController.bind(
            targetSlot,
            createChatViewSlotBinding({
              key: 'channel-list',
              kind: 'channelList',
              source: { view: activeView },
            }),
          );
        }

        layoutController.setSlotHidden(targetSlot, false);
      }

      layoutController.setEntityListPaneOpen(true);
    };

    return {
      closeChannel,
      closeThread,
      hideChannelList,
      openChannel,
      openThread,
      openView,
      unhideChannelList,
    };
  }, [activeSlot, activeView, layoutController, slotBindings, visibleSlots]);

  return (
    <ChatViewNavigationContext.Provider value={value}>
      {children}
    </ChatViewNavigationContext.Provider>
  );
};
