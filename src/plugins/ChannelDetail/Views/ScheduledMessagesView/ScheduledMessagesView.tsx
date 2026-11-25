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
  useChannelWideScheduledMessagesView,
  useOpenScheduledMessageInComposer,
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

  const channelWideView = useChannelWideScheduledMessagesView(channel);
  const openInComposer = useOpenScheduledMessageInComposer(channel);
  const { scheduledMessages } = useChannelScheduledMessages(channelWideView);
  const { filter, setSearchQuery } = useScheduledMessagesSearch();

  const editScheduledMessage = useCallback(
    (scheduledMessage: ScheduledMessageResponse) => {
      close();
      void openInComposer(scheduledMessage);
    },
    [close, openInComposer],
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
          scheduledMessages={channelWideView}
        />
      </Prompt.Body>
    </div>
  );
};
