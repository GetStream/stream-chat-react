import clsx from 'clsx';
import { nsToDate } from 'stream-chat';
import React, { useMemo } from 'react';

import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import { ChannelAvatar } from '../Avatar';
import { useChannelPreviewInfo } from '../ChannelListItem/hooks/useChannelPreviewInfo';
import { SummarizedMessagePreview } from '../SummarizedMessagePreview';
import { ScheduledMessageActions as DefaultScheduledMessageActions } from './ScheduledMessageActions';
import { ScheduledMessageItemStatus } from './ScheduledMessageItemStatus';
import type { ScheduledMessageItemProps } from './types';
import { isFailedScheduledMessage, toStoredScheduledMessagePreview } from './utils';

export const ScheduledMessageItem = ({
  onEdit,
  scheduledMessage,
}: ScheduledMessageItemProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { ScheduledMessageActions: ScheduledMessageActionsOverride } =
    useComponentContext();

  const { cid, scheduled_at } = scheduledMessage;
  const channel = client.channelManager.get(cid);
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });
  const ScheduledMessageActions =
    ScheduledMessageActionsOverride === undefined
      ? DefaultScheduledMessageActions
      : ScheduledMessageActionsOverride;

  const previewMessage = useMemo(
    () => toStoredScheduledMessagePreview(scheduledMessage),
    [scheduledMessage],
  );

  const isFailed = isFailedScheduledMessage(scheduledMessage);
  const sendTime = t('timestamp.ScheduledMessageSendTime', {
    timestamp: nsToDate(scheduled_at),
  });

  return (
    <div
      className={clsx('str-chat__scheduled-message-item', {
        'str-chat__scheduled-message-item--failed': isFailed,
      })}
      data-testid='scheduled-message-item'
    >
      <time
        className='str-chat__scheduled-message-item__time'
        dateTime={nsToDate(scheduled_at).toISOString()}
      >
        {t('scheduledMessages.sendTime', 'Send {{ time }}', { time: sendTime })}
      </time>
      {ScheduledMessageActions && (
        <ScheduledMessageActions onEdit={onEdit} scheduledMessage={scheduledMessage} />
      )}
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
