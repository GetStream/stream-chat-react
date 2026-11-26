import {
  type BaseSyntheticEvent,
  createContext,
  type PropsWithChildren,
  useCallback,
  useState,
} from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import { useChatViewNavigation, useSlotChannel } from 'stream-chat-react/slot-layout';

import { CHANNEL_THREAD_SLOT, MAIN_CHANNEL_SLOT } from '../constants';
import { ChannelMemberDetailModal } from './ChannelMemberDetailModal';
import { opensMemberDetailBeside } from './utils';

export type OpenMemberDetail = (
  userId: string | undefined,
  event: BaseSyntheticEvent,
  channel: StreamChannel,
) => void;

// Opens a member's profile from a click on a message avatar or a mention. Panels are rendered by
// the slots, not by the view, so the view provides this to them; outside the channels view it is
// missing and those clicks open nothing.
export const MemberDetailContext = createContext<OpenMemberDetail | undefined>(undefined);

// A plain click opens the profile in a modal, which this provider renders; a ⌘/ctrl-click opens it
// in the secondary slot, as the `userProfile` kind (`ChannelMemberDetailPanel` renders it).
export const MemberDetailProvider = ({ children }: PropsWithChildren) => {
  const { open } = useChatViewNavigation();
  const mainChannel = useSlotChannel({ slot: MAIN_CHANNEL_SLOT });
  const [modalMember, setModalMember] = useState<{
    channel: StreamChannel;
    userId: string;
  }>();

  const openMemberDetail = useCallback<OpenMemberDetail>(
    (userId, event, channel) => {
      if (!userId) return;
      if (!opensMemberDetailBeside(event, channel, mainChannel)) {
        setModalMember({ channel, userId });
        return;
      }
      open(
        { key: userId, kind: 'userProfile', source: { userId } },
        { slot: CHANNEL_THREAD_SLOT },
      );
    },
    [mainChannel, open],
  );

  return (
    <MemberDetailContext.Provider value={openMemberDetail}>
      {children}
      {modalMember && (
        <ChannelMemberDetailModal
          channel={modalMember.channel}
          onClose={() => setModalMember(undefined)}
          userId={modalMember.userId}
        />
      )}
    </MemberDetailContext.Provider>
  );
};
