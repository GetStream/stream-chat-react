import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { useMessageAlsoSentInChannelNavigation } from './hooks';

export type MessageAlsoSentInChannelIndicatorProps = {
  /**
   * Overrides the "View" click handler. Defaults to
   * `useMessageAlsoSentInChannelNavigation().viewReference`. May return a promise.
   */
  onView?: () => void | Promise<void>;
};

/**
 * Indicator for a message that is also shown in the channel (`show_in_channel`). Navigation comes
 * from {@link useMessageAlsoSentInChannelNavigation}.
 */
export const MessageAlsoSentInChannelIndicator = ({
  onView,
}: MessageAlsoSentInChannelIndicatorProps = {}) => {
  const { IconArrowUpRight } = useComponentContextIcons();
  const { t } = useTranslationContext();
  const { isInThread, isShownInChannel, viewReference } =
    useMessageAlsoSentInChannelNavigation();

  if (!isShownInChannel) return null;

  return (
    <div className='str-chat__message-also-sent-in-channel' role='status'>
      <IconArrowUpRight />
      <span>
        {isInThread
          ? t('message.alsoSent.alsoSentChannel.text', 'Also sent in channel')
          : t('message.alsoSent.repliedThread.text', 'Replied to a thread')}
      </span>
      <span> · </span>
      <button
        className='str-chat__message-also-sent-in-channel__link-button'
        onClick={onView ?? viewReference}
        type='button'
      >
        {t('message.alsoSent.view.text', 'View')}
      </button>
    </div>
  );
};
