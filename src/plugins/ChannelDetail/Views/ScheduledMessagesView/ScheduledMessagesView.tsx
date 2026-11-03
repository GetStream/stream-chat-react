import React, { useState } from 'react';

import { useModalContext, useTranslationContext } from '../../../../context';
import { Prompt } from '../../../../components/Dialog';
import {
  ScheduledMessageList,
  useScheduledMessageCount,
} from '../../../../components/ScheduledMessages';
import { ChannelDetailSearchInput } from '../../ChannelDetailSearchInput';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { SectionNavigatorHeader } from '../../SectionNavigator';

export const ScheduledMessagesView = () => {
  const { t } = useTranslationContext();
  const { close } = useModalContext();
  const { channel } = useChannelDetailContext();

  const scheduledMessageCount = useScheduledMessageCount({ cid: channel.cid });

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='str-chat__channel-detail__scheduled-messages-view'>
      <SectionNavigatorHeader close={close} title={t('Scheduled messages')} />
      <Prompt.Body className='str-chat__channel-detail__scheduled-messages-view__body'>
        {scheduledMessageCount > 0 && (
          <ChannelDetailSearchInput onSearchChange={setSearchQuery} />
        )}
        <ScheduledMessageList cid={channel.cid} searchQuery={searchQuery} />
      </Prompt.Body>
    </div>
  );
};
