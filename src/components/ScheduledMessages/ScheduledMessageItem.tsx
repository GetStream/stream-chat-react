import clsx from 'clsx';
import React, { useMemo } from 'react';

import { useChatContext, useTranslationContext } from '../../context';
import { ChannelAvatar } from '../Avatar';
import { useChannelPreviewInfo } from '../ChannelListItem/hooks/useChannelPreviewInfo';
import { SummarizedMessagePreview } from '../SummarizedMessagePreview';
import { ScheduledMessageItemStatus } from './ScheduledMessageItemStatus';
import type { ScheduledMessageItemProps } from './types';
import { isFailedScheduledMessage, toStoredScheduledMessagePreview } from './utils';

export const ScheduledMessageItem = ({ scheduledMessage }: ScheduledMessageItemProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();

  const { cid, scheduled_at } = scheduledMessage;
  const channel = client.activeChannels[cid];
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });

  const previewMessage = useMemo(
    () => toStoredScheduledMessagePreview(scheduledMessage),
    [scheduledMessage],
  );

  const isFailed = isFailedScheduledMessage(scheduledMessage);
  const sendTime = t('timestamp/ScheduledMessageSendTime', {
    timestamp: new Date(scheduled_at),
  });

  return (
    <div
      className={clsx('str-chat__scheduled-message-item', {
        'str-chat__scheduled-message-item--failed': isFailed,
      })}
      data-testid='scheduled-message-item'
    >
      <time className='str-chat__scheduled-message-item__time' dateTime={scheduled_at}>
        {t('Send {{ time }}', { time: sendTime })}
      </time>
      <div className='str-chat__scheduled-message-item__body'>
        <ChannelAvatar
          aria-hidden='true'
          displayMembers={groupChannelDisplayInfo.members}
          imageUrl={displayImage}
          size='lg'
          userName={displayTitle}
        />
        <div className='str-chat__scheduled-message-item__content'>
          {displayTitle && (
            <span className='str-chat__scheduled-message-item__channel-name'>
              {displayTitle}
            </span>
          )}
          <SummarizedMessagePreview latestMessage={previewMessage} />
          <ScheduledMessageItemStatus scheduledMessage={scheduledMessage} />
        </div>
      </div>
    </div>
  );
};
