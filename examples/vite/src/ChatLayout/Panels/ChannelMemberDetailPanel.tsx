import { useCallback } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import { useChatViewNavigation, useSlotChannel } from 'stream-chat-react/slot-layout';
import {
  ChannelDetailProvider,
  ChannelMemberDetail,
} from 'stream-chat-react/channel-detail';

import { MAIN_CHANNEL_SLOT } from '../constants';
import { useHasContentBeneath } from '../hooks';
import { useChannelMember } from '../MemberDetail';
import { SecondarySlotSurface } from './SecondarySlotSurface';

const ChannelMemberDetailContent = ({
  channel,
  hasContentBeneath,
  onClose,
  userId,
}: {
  channel: StreamChannel;
  hasContentBeneath: boolean;
  onClose: () => void;
  userId: string;
}) => {
  const member = useChannelMember(channel, userId);
  if (!member) return null;

  // `ChannelMemberDetail` is built for the ChannelDetail navigator: its member actions read the
  // channel from `ChannelDetailProvider`, and its header's close button calls `onClose`.
  return (
    <ChannelDetailProvider channel={channel} onClose={onClose}>
      <ChannelMemberDetail
        layout='inline'
        member={member}
        onBack={hasContentBeneath ? onClose : undefined}
      />
    </ChannelDetailProvider>
  );
};

// A member's profile in the secondary slot, opened with a ⌘/ctrl-click on a message avatar or a
// mention. It is the SDK's `userProfile` kind, whose `{ userId }` source is resolved to a member of
// the main channel. Back is offered while it covers something; back and close both reveal it.
export const ChannelMemberDetailPanel = ({
  slot,
  userId,
}: {
  slot: string;
  userId: string;
}) => {
  const { close } = useChatViewNavigation();
  const channel = useSlotChannel({ slot: MAIN_CHANNEL_SLOT });
  const hasContentBeneath = useHasContentBeneath(slot);
  const closePanel = useCallback(() => close(slot), [close, slot]);

  return (
    <SecondarySlotSurface>
      {channel ? (
        <ChannelMemberDetailContent
          channel={channel}
          hasContentBeneath={hasContentBeneath}
          onClose={closePanel}
          userId={userId}
        />
      ) : null}
    </SecondarySlotSurface>
  );
};
