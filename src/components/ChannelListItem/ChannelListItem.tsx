import throttle from 'lodash.throttle';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import type {
  Channel,
  Event,
  LocalMessage,
  MessagePaginatorAggregateState,
} from 'stream-chat';

import { useStateStore } from '../../store';

import { ChannelListItemUI as DefaultChannelListItemUI } from './ChannelListItemUI';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';
import { useChannelPreviewInfo } from './hooks/useChannelPreviewInfo';
import type { MessageDeliveryStatus } from './hooks/useMessageDeliveryStatus';
import { useMessageDeliveryStatus } from './hooks/useMessageDeliveryStatus';
import type { GroupChannelDisplayInfo } from './utils';
import {
  useChatContext,
  useComponentContext,
  useWorkspaceNavigation,
} from '../../context';
import { useChannelMembershipState } from '../ChannelList';

export type ChannelListItemUIProps = ChannelListItemProps & {
  /** Image of Channel to display */
  displayImage?: string;
  /** Title of Channel to display */
  displayTitle?: string;
  /** Title of Channel to display */
  groupChannelDisplayInfo?: GroupChannelDisplayInfo;
  /** The message previewed by this item — see {@link ChannelListItemProps.previewedMessage}. */
  previewedMessage?: LocalMessage;
  /** Status describing whether own message has been delivered or read by another. If the last message is not an own message, then the status is undefined. */
  messageDeliveryStatus?: MessageDeliveryStatus;
  /** Whether the channel is muted by the current user */
  muted?: boolean;
  /** Whether the channel is pinned by the current user */
  pinned?: boolean;
  /** Number of unread Messages */
  unread?: number;
};

export type ChannelListItemProps = {
  /** Comes from either the `channelRenderFilterFn` or `usePaginatedChannels` call from [ChannelList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelList.tsx) */
  channel: Channel;
  /** If the component's channel is the active (selected) Channel */
  active?: boolean;
  /** Current selected channel object */
  activeChannel?: Channel;
  /** Forces the update of preview component on channel update */
  channelUpdateCount?: number;
  /** Custom class for the channel preview root */
  className?: string;
  key?: string;
  /**
   * The message previewed by this item. Defaults to the channel's reactive latest message
   * (`channel.messagePaginator.aggregateState.lastMessage`); pass a specific message to preview it
   * instead — e.g. a search result previewing the matched message, where the channel's latest message
   * would be misleading.
   */
  previewedMessage?: LocalMessage;
  /** Custom ChannelListItem click handler function */
  onSelect?: (event: React.MouseEvent) => void;
  /** Object containing watcher parameters */
  watchers?: { limit?: number; offset?: number };
};

const ChannelListItemContext = React.createContext<{ channel: Channel }>({
  channel: null as unknown as Channel,
});

export const useChannelListItemContext = () => useContext(ChannelListItemContext);

const lastMessageSelector = ({ lastMessage }: MessagePaginatorAggregateState) => ({
  lastMessage: lastMessage ?? undefined,
});

export const ChannelListItem = (props: ChannelListItemProps) => {
  const { active, channel, channelUpdateCount } = props;
  const { ChannelListItemUI = DefaultChannelListItemUI } = useComponentContext();
  const { client } = useChatContext('ChannelPreview');
  // Active = THIS channel is currently open in the workspace. Keyed on the channel's own
  // cid (never "the first channel slot"), so multiple open channels each highlight independently.
  const channelOpenInSlot = useWorkspaceNavigation().isChannelActive(
    channel.cid ?? undefined,
  );
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });
  const membership = useChannelMembershipState(channel);

  const { lastMessage: trackedLastMessage } = useStateStore(
    channel.messagePaginator.aggregateState,
    lastMessageSelector,
  );
  // A caller may override the previewed message per instance (e.g. a search result previewing the
  // matched message); otherwise use the channel's reactive tracked latest.
  const previewedMessage = props.previewedMessage ?? trackedLastMessage;

  const [unread, setUnread] = useState(0);
  const { messageDeliveryStatus } = useMessageDeliveryStatus({
    channel,
    lastMessage: previewedMessage,
  });

  const isActive = typeof active === 'undefined' ? !!channelOpenInSlot : active;
  const { muted } = useIsChannelMuted(channel);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (!event.cid) return setUnread(0);
      if (channel.cid === event.cid) setUnread(0);
    };

    client.on('notification.mark_read', handleEvent);
    return () => client.off('notification.mark_read', handleEvent);
  }, [channel, client]);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (channel.cid !== event.cid) return;
      if (event.user?.id !== client.user?.id) return;
      setUnread(channel.countUnread());
    };
    channel.on('notification.mark_unread', handleEvent);
    return () => {
      channel.off('notification.mark_unread', handleEvent);
    };
  }, [channel, client]);

  const refreshUnreadCount = useMemo(
    () =>
      throttle(() => {
        if (muted) {
          setUnread(0);
        } else {
          setUnread(channel.countUnread());
        }
      }, 400),
    [channel, muted],
  );

  useEffect(() => {
    refreshUnreadCount();

    const handleEvent = (event: Event) => {
      const deletedMessagesInAnotherChannel =
        event.type === 'user.messages.deleted' && event.cid && event.cid !== channel.cid;

      if (deletedMessagesInAnotherChannel) return;

      refreshUnreadCount();
    };

    channel.on('message.new', handleEvent);
    channel.on('message.updated', handleEvent);
    channel.on('message.deleted', handleEvent);
    client.on('user.messages.deleted', handleEvent);
    channel.on('message.undeleted', handleEvent);
    channel.on('channel.truncated', handleEvent);

    return () => {
      channel.off('message.new', handleEvent);
      channel.off('message.updated', handleEvent);
      channel.off('message.deleted', handleEvent);
      client.off('user.messages.deleted', handleEvent);
      channel.off('message.undeleted', handleEvent);
      channel.off('channel.truncated', handleEvent);
    };
  }, [channel, client, refreshUnreadCount, channelUpdateCount]);

  const channelPreviewContextValue = useMemo(() => ({ channel }), [channel]);

  if (!ChannelListItemUI) return null;

  return (
    <ChannelListItemContext.Provider value={channelPreviewContextValue}>
      <ChannelListItemUI
        {...props}
        active={isActive}
        displayImage={displayImage}
        displayTitle={displayTitle}
        groupChannelDisplayInfo={groupChannelDisplayInfo}
        messageDeliveryStatus={messageDeliveryStatus}
        muted={muted}
        pinned={!!membership.pinned_at}
        previewedMessage={previewedMessage}
        unread={unread}
      />
    </ChannelListItemContext.Provider>
  );
};
