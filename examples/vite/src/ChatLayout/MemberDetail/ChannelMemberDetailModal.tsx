import type { Channel as StreamChannel } from 'stream-chat';
import {
  asDynamicKey,
  GlobalModal,
  Prompt,
  useComponentContext,
  useTranslationContext,
} from 'stream-chat-react';
import {
  ChannelDetailProvider,
  ChannelMemberDetail,
} from 'stream-chat-react/channel-detail';

import { useChannelMember } from './hooks/useChannelMember';

// A member's profile in a modal, opened with a plain click on a message avatar or a mention.
export const ChannelMemberDetailModal = ({
  channel,
  onClose,
  userId,
}: {
  channel: StreamChannel;
  onClose: () => void;
  userId: string;
}) => {
  const { t } = useTranslationContext();
  const { Modal = GlobalModal } = useComponentContext();
  const member = useChannelMember(channel, userId);

  return (
    <Modal
      aria-label={t(asDynamicKey('viteExample.memberDetail.ariaLabel'), 'Member details')}
      dialogRootProps={{ className: 'str-chat__channel-detail-modal' }}
      onClose={onClose}
      open
    >
      {/* The prompt is the modal's surface, styled as the channel details but sized as the user's
          own profile modal. */}
      <Prompt.Root className='str-chat__channel-detail app-member-detail-modal'>
        {member ? (
          <ChannelDetailProvider channel={channel} onClose={onClose}>
            <ChannelMemberDetail layout='tabs' member={member} />
          </ChannelDetailProvider>
        ) : null}
      </Prompt.Root>
    </Modal>
  );
};
