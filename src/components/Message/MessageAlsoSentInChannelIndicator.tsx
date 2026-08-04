import React from 'react';

import { IconArrowUpRight } from '../Icons';
import { useTranslationContext } from '../../context';
import { useMessageAlsoSentInChannelNavigation } from './hooks';

export type MessageAlsoSentInChannelIndicatorProps = {
  /**
   * Overrides the "View" click handler. Defaults to the built-in reference navigation
   * (`useMessageAlsoSentInChannelNavigation().viewReference`). Integrators can supply their own —
   * e.g. to run extra layout side effects around the jump — by composing that hook, without
   * re-implementing the component. Returning a promise is supported.
   */
  onView?: () => void | Promise<void>;
};

/**
 * Indicator shown when the message was also sent to the main channel (show_in_channel === true).
 * The navigation lives in {@link useMessageAlsoSentInChannelNavigation} so it can be reused.
 */
export const MessageAlsoSentInChannelIndicator = ({
  onView,
}: MessageAlsoSentInChannelIndicatorProps = {}) => {
  const { t } = useTranslationContext();
  const { isInThread, isShownInChannel, viewReference } =
    useMessageAlsoSentInChannelNavigation();

  if (!isShownInChannel) return null;

  return (
    <div className='str-chat__message-also-sent-in-channel' role='status'>
      <IconArrowUpRight />
      <span>{isInThread ? t('Also sent in channel') : t('Replied to a thread')}</span>
      <span> · </span>
      <button
        className='str-chat__message-also-sent-in-channel__link-button'
        onClick={onView ?? viewReference}
        type='button'
      >
        {t('View')}
      </button>
    </div>
  );
};
