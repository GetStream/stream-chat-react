import React from 'react';

import { useModalContext, useTranslationContext } from '../../../../context';
import { Prompt } from '../../../../components/Dialog';
import { ScheduledMessageList } from '../../../../components/ScheduledMessages';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { SectionNavigatorHeader } from '../../SectionNavigator';

export const ScheduledMessagesView = () => {
  const { t } = useTranslationContext();
  const { close } = useModalContext();
  const { channel } = useChannelDetailContext();

  return (
    <div className='str-chat__channel-detail__scheduled-messages-view'>
      <SectionNavigatorHeader
        close={close}
        description={t('Messages waiting to be sent')}
        title={t('Scheduled messages')}
      />
      <Prompt.Body className='str-chat__channel-detail__scheduled-messages-view__body'>
        <ScheduledMessageList cid={channel.cid} />
      </Prompt.Body>
    </div>
  );
};
