import React, { useMemo } from 'react';
import type { LocalMessage } from 'stream-chat';

import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString, isDate } from '../../i18n/utils';

export type ChannelPreviewTimestampProps = {
  /** The last message in the channel, used to extract the timestamp */
  lastMessage?: LocalMessage;
};

export function ChannelPreviewTimestamp({ lastMessage }: ChannelPreviewTimestampProps) {
  const { t, tDateTimeParser } = useTranslationContext('ChannelPreviewTimestamp');

  const timestamp = lastMessage?.created_at;
  const normalizedTimestamp =
    timestamp && isDate(timestamp) ? timestamp.toISOString() : undefined;

  const when = useMemo(
    () =>
      getDateString({
        messageCreatedAt: normalizedTimestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/ChannelPreviewTimestamp',
      }),
    [normalizedTimestamp, t, tDateTimeParser],
  );

  if (!when) return null;

  return (
    <time className='str-chat__channel-preview-timestamp' dateTime={normalizedTimestamp}>
      {when}
    </time>
  );
}
