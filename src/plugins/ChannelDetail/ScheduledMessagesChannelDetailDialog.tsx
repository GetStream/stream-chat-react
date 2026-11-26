import React from 'react';
import type { ComponentType } from 'react';

import { useComponentContext, useTranslationContext } from '../../context';
import { useMessageComposerController } from '../../components/MessageComposer/hooks/useMessageComposerController';
import { GlobalModal } from '../../components/Modal';
import {
  ScheduledMessageListDialog,
  type ScheduledMessageListDialogProps,
} from '../../components/ScheduledMessages';
import {
  type ChannelDetailProps,
  ChannelDetail as DefaultChannelDetail,
} from './ChannelDetail';
import type { SectionNavigatorRoute } from './SectionNavigator';

export type ScheduledMessagesChannelDetailDialogProps =
  ScheduledMessageListDialogProps & {
    ChannelDetail?: ComponentType<ChannelDetailProps>;
  };

const scheduledMessagesSectionHistory: SectionNavigatorRoute[] = [
  { id: 'scheduled-messages' },
];

const channelDetailDialogRootProps = {
  className: 'str-chat__channel-detail-modal',
};

export const ScheduledMessagesChannelDetailDialog = ({
  ChannelDetail = DefaultChannelDetail,
  ...dialogProps
}: ScheduledMessagesChannelDetailDialogProps) => {
  const { t } = useTranslationContext();
  const { Modal = GlobalModal } = useComponentContext();

  const { channel } = useMessageComposerController();

  const { close, open, scheduledMessages } = dialogProps;

  if (scheduledMessages.parentId) return <ScheduledMessageListDialog {...dialogProps} />;

  return (
    <Modal
      aria-label={t(
        'channelDetail.avatarChannelDetail.channelDetails.ariaLabel',
        'Channel details',
      )}
      dialogRootProps={channelDetailDialogRootProps}
      onClose={close}
      open={open}
    >
      {open && (
        <ChannelDetail
          channel={channel}
          initialHistory={scheduledMessagesSectionHistory}
        />
      )}
    </Modal>
  );
};
