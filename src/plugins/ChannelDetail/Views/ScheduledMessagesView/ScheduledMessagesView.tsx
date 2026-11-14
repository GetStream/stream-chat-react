import React, { useCallback } from 'react';
import type { ScheduledMessageResponse } from 'stream-chat';

import {
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import { Prompt } from '../../../../components/Dialog';
import {
  ScheduledMessageList as DefaultScheduledMessageList,
  useChannelScheduledMessages,
  useScheduledMessagesSearch,
} from '../../../../components/ScheduledMessages';
import { ChannelDetailSearchInput } from '../../ChannelDetailSearchInput';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { SectionNavigatorHeader } from '../../SectionNavigator';

export const ScheduledMessagesView = () => {
  const { t } = useTranslationContext();
  const { ScheduledMessageList = DefaultScheduledMessageList } = useComponentContext();
  const { close } = useModalContext();
  const { channel } = useChannelDetailContext();

  const { scheduledMessages } = useChannelScheduledMessages(channel.scheduledMessages);
  const { filter, setSearchQuery } = useScheduledMessagesSearch();

  const editScheduledMessage = useCallback(
    (scheduledMessage: ScheduledMessageResponse) => {
      close();
      channel.messageComposer.editScheduledMessage(scheduledMessage);
    },
    [channel, close],
  );

  return (
    <div className='str-chat__channel-detail__scheduled-messages-view'>
      <SectionNavigatorHeader
        close={close}
        title={t('scheduledMessages.scheduledMessages', 'Scheduled messages')}
      />
      <Prompt.Body className='str-chat__channel-detail__scheduled-messages-view__body'>
        {scheduledMessages.length > 0 && (
          <ChannelDetailSearchInput onSearchChange={setSearchQuery} />
        )}
        <ScheduledMessageList
          filter={filter}
          openInComposer={editScheduledMessage}
          scheduledMessages={channel.scheduledMessages}
        />
      </Prompt.Body>
    </div>
  );
};
