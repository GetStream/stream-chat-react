import React from 'react';
import clsx from 'clsx';

import { Button } from '../Button';
import { useComponentContextIcons, useTranslationContext } from '../../context';

/** Props of the component a paginated list renders when its first page failed to load. */
export type ListLoadErrorIndicatorProps = {
  /** The error of the failed query. */
  error: Error;
  /** A retry is running; the list keeps this component on screen meanwhile. */
  isRetrying: boolean;
  /** Queries the first page again, unless a retry is running. */
  retry: () => void;
};

export type DefaultListLoadErrorIndicatorProps = ListLoadErrorIndicatorProps & {
  /** Which list failed to load; picks the explanation. */
  listType: 'channel' | 'scheduled-message' | 'thread';
};

/**
 * Shown in place of a list whose first page failed to load: an icon, a short explanation and a
 * button that queries the first page again.
 */
export const ListLoadErrorIndicator = ({
  isRetrying,
  listType,
  retry,
}: DefaultListLoadErrorIndicatorProps) => {
  const { t } = useTranslationContext();
  const { IconExclamationMark } = useComponentContextIcons();

  const text =
    listType === 'channel'
      ? t('channelList.loadError.text', "Couldn't load conversations")
      : listType === 'scheduled-message'
        ? t(
            'scheduledMessages.couldntLoadScheduledMessages',
            "Couldn't load scheduled messages",
          )
        : t('threadList.loadError.text', "Couldn't load threads");

  return (
    <div
      className={clsx(
        'str-chat__list-load-error',
        `str-chat__${listType}-list-load-error`,
      )}
    >
      <IconExclamationMark className='str-chat__list-load-error__icon' />
      <div className='str-chat__list-load-error__content'>
        <p className='str-chat__list-load-error__title'>{text}</p>
        {/* aria-disabled, not disabled: a disabled button would lose focus. */}
        <Button
          appearance='outline'
          aria-busy={isRetrying}
          aria-disabled={isRetrying}
          className='str-chat__list-load-error__retry-button'
          onClick={retry}
          size='md'
          variant='secondary'
        >
          {t('common.tryAgain.label', 'Try again')}
        </Button>
      </div>
    </div>
  );
};
