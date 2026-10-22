import throttle from 'lodash.throttle';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import type { Channel, LocalMessage, MessagePaginatorAggregateState } from 'stream-chat';

import { useStateStore } from '../../store';

import { ChannelListItemUI as DefaultChannelListItemUI } from './ChannelListItemUI';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';
import { useChannelPreviewInfo } from './hooks/useChannelPreviewInfo';
import type { MessageDeliveryStatus } from './hooks/useMessageDeliveryStatus';
import { useMessageDeliveryStatus } from './hooks/useMessageDeliveryStatus';
import type { GroupChannelDisplayInfo } from './utils';
import type { ChannelListItemLabelConfig } from './utils.a11y';
import {
  useChatContext,
  useComponentContext,
  useWorkspaceNavigation,
} from '../../context';
import { useChannelMembershipState } from '../ChannelList';
import { requireContext } from '../../context/requireContext';

export type ChannelListItemUIProps = ChannelListItemProps & {
  /**
   * Configures the row's accessible name: part overrides, order, separator, or a full `build`.
   * Supply it from a `ComponentContext`-provided `ChannelListItemUI`. See
   * `composeChannelListItemAccessibleLabel`.
   */
  accessibleLabelConfig?: ChannelListItemLabelConfig;
  displayImage?: string;
  displayTitle?: string;
  /** Members for the group avatar; empty unless the channel has more than 2 members. */
  groupChannelDisplayInfo?: GroupChannelDisplayInfo;
  /** See {@link ChannelListItemProps.previewedMessage}. */
  previewedMessage?: LocalMessage;
  /** Delivery status of the previewed message. Undefined when it is not an own message. */
  messageDeliveryStatus?: MessageDeliveryStatus;
  muted?: boolean;
  pinned?: boolean;
  /** Unread message count, 0 while the channel is muted. */
  unread?: number;
};

export type ChannelListItemProps = {
  /** Channel to preview: a `ChannelList` item, or any channel, e.g. in search results. */
  channel: Channel;
  /** Whether the channel is the active one. Defaults to whether it is shown in the workspace. */
  active?: boolean;
  /** Current selected channel object */
  activeChannel?: Channel;
  /** Custom class for the row button. */
  className?: string;
  /**
   * Message previewed by the item. Defaults to the channel's latest message
   * (`channel.messagePaginator.aggregateState.latestMessage`); a search result passes the matched
   * message instead.
   */
  previewedMessage?: LocalMessage;
  /** Replaces the default click handler, which opens the channel in the workspace. */
  onSelect?: (event: React.MouseEvent) => void;
};

const ChannelListItemContext = React.createContext<{ channel: Channel } | undefined>(
  undefined,
);

export const useChannelListItemContext = () =>
  requireContext(
    useContext(ChannelListItemContext),
    'useChannelListItemContext',
    'ChannelListItemUI',
  );

const latestMessageSelector = ({ latestMessage }: MessagePaginatorAggregateState) => ({
  latestMessage: latestMessage ?? undefined,
});

export const ChannelListItem = (props: ChannelListItemProps) => {
  const { active, channel } = props;
  const { ChannelListItemUI = DefaultChannelListItemUI } = useComponentContext();
  const { client } = useChatContext();
  // Active means this channel is shown in the workspace. Keyed on its own `cid`, so every open
  // channel highlights independently.
  const channelOpenInSlot = useWorkspaceNavigation().isChannelActive(
    channel.cid ?? undefined,
  );
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });
  const membership = useChannelMembershipState(channel);

  const { latestMessage: trackedLatestMessage } = useStateStore(
    channel.messagePaginator.aggregateState,
    latestMessageSelector,
  );
  const previewedMessage = props.previewedMessage ?? trackedLatestMessage;

  const { messageDeliveryStatus } = useMessageDeliveryStatus({
    channel,
    lastMessage: previewedMessage,
  });

  const isActive = typeof active === 'undefined' ? !!channelOpenInSlot : active;
  const { muted } = useIsChannelMuted(channel);

  // The channel owns this number: `countUnread()` with no argument returns
  // `read[ownUserId].unread_messages`, which every event that moves it writes first. Reading the
  // store means the guards on those writes (a thread read is not a channel read, a read by
  // somebody else is not ours) hold here too.
  const [unreadCount, setUnreadCount] = useState(() => channel.countUnread());

  useEffect(() => {
    const ownUserId = client.user?.id;
    // Throttled because a backfill or a burst of traffic can move the count many times in a frame.
    // Leading edge, so the first change still lands at once.
    const apply = throttle(setUnreadCount, 400);

    const unsubscribe = channel.state.subscribeWithSelector(
      ({ read }) => ({
        unreadCount: ownUserId ? (read[ownUserId]?.unread_messages ?? 0) : 0,
      }),
      ({ unreadCount }) => apply(unreadCount),
    );

    return () => {
      apply.cancel();
      unsubscribe();
    };
  }, [channel, client]);

  // A muted channel still counts unread but does not advertise it. Applied at render, not in the
  // subscription, so muting and unmuting show up without waiting on the throttle.
  const unread = muted ? 0 : unreadCount;

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
        pinned={membership.pinned_at != null}
        previewedMessage={previewedMessage}
        unread={unread}
      />
    </ChannelListItemContext.Provider>
  );
};
