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
   * Configures the row's composed accessible name (part overrides, order, separator, or a full
   * `build`). Supply it from a `ComponentContext`-provided `ChannelListItemUI` to customize the
   * announcement. See `composeChannelListItemAccessibleLabel`.
   */
  accessibleLabelConfig?: ChannelListItemLabelConfig;
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

const ChannelListItemContext = React.createContext<{ channel: Channel } | undefined>(
  undefined,
);

export const useChannelListItemContext = () =>
  requireContext(
    useContext(ChannelListItemContext),
    'useChannelListItemContext',
    'ChannelListItemUI',
  );

const lastMessageSelector = ({ lastMessage }: MessagePaginatorAggregateState) => ({
  lastMessage: lastMessage ?? undefined,
});

export const ChannelListItem = (props: ChannelListItemProps) => {
  const { active, channel } = props;
  const { ChannelListItemUI = DefaultChannelListItemUI } = useComponentContext();
  const { client } = useChatContext();
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

  const { messageDeliveryStatus } = useMessageDeliveryStatus({
    channel,
    lastMessage: previewedMessage,
  });

  const isActive = typeof active === 'undefined' ? !!channelOpenInSlot : active;
  const { muted } = useIsChannelMuted(channel);

  // The channel already owns this number: `countUnread()` with no argument returns
  // `read[ownUserId].unread_messages`, and everything that moves it - a new message, a read from
  // any device, an explicit mark-unread, a truncation, mark-all-read - writes there first. Reading
  // the store means the guards that come with those writes (a thread read is not a channel read, a
  // read by somebody else is not ours) hold here too, rather than being restated per event.
  const [unreadCount, setUnreadCount] = useState(() => channel.countUnread());

  useEffect(() => {
    const ownUserId = client.user?.id;
    // Throttled rather than rendered per change: a backfill or a burst of traffic can move the
    // count many times in a frame, and a badge only has to keep up with the eye. Leading edge, so
    // the first change still lands at once.
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

  // A muted channel still counts unread; it just does not advertise it. Applied at render rather
  // than inside the subscription so muting and unmuting show up without waiting on the throttle.
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
