import React, { useCallback, useState } from 'react';
import type { ScheduledMessageResponse } from 'stream-chat';

import {
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import { Prompt } from '../../../../components/Dialog';
import {
  ScheduledMessageList as DefaultScheduledMessageList,
  useScheduledMessageCount,
} from '../../../../components/ScheduledMessages';
import { openScheduledMessageInComposer } from '../../../../components/ScheduledMessages/utils';
import { ChannelDetailSearchInput } from '../../ChannelDetailSearchInput';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { SectionNavigatorHeader } from '../../SectionNavigator';

export const ScheduledMessagesView = () => {
  const { t } = useTranslationContext();
  const { ScheduledMessageList = DefaultScheduledMessageList } = useComponentContext();
  const { close } = useModalContext();
  const { channel } = useChannelDetailContext();

  const scheduledMessageCount = useScheduledMessageCount({ cid: channel.cid });

  const [searchQuery, setSearchQuery] = useState('');

  const editScheduledMessage = useCallback(
    (scheduledMessage: ScheduledMessageResponse) => {
      close();
      openScheduledMessageInComposer(channel.messageComposer, scheduledMessage);
    },
    [channel, close],
  );

  return (
    <div className='str-chat__channel-detail__scheduled-messages-view'>
      <SectionNavigatorHeader
        close={close}
        description={t('Messages waiting to be sent')}
        title={t('Scheduled messages')}
      />
      <Prompt.Body className='str-chat__channel-detail__scheduled-messages-view__body'>
        {scheduledMessageCount > 0 && (
          <ChannelDetailSearchInput onSearchChange={setSearchQuery} />
        )}
        <ScheduledMessageList
          cid={channel.cid}
          onEdit={editScheduledMessage}
          searchQuery={searchQuery}
        />
      </Prompt.Body>
    </div>
  );
};
