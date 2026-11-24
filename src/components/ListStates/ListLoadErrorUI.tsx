import type { ComponentType } from 'react';
import React from 'react';
import clsx from 'clsx';

import { Button } from '../Button';
import { LoadingIndicator } from '../Loading/LoadingIndicator';
import { useComponentContextIcons, useTranslationContext } from '../../context';

/** Props of the component a paginated list renders when its first page failed to load. */
export type ListLoadErrorUIProps = {
  /** The error of the failed query. */
  error: Error;
  /** A retry is running; the list keeps this component on screen meanwhile. */
  isRetrying: boolean;
  /** Queries the first page again, unless a retry is running. */
  retry: () => void;
};

/** Props of the button that queries the first page again. */
export type ListLoadErrorRetryButtonProps = Pick<
  ListLoadErrorUIProps,
  'isRetrying' | 'retry'
>;

/**
 * Props of the SDK's `ListLoadErrorUI`: what a list passes to the `ListLoadErrorUI`
 * key, plus the parts an app can replace when it renders the component itself.
 */
export type ListLoadErrorUIComponentProps = ListLoadErrorUIProps & {
  /** Added to the root's `str-chat__list-load-error` class. */
  className?: string;
  /** The icon. Defaults to the `IconExclamationMark` icon. */
  Icon?: ComponentType<{ className?: string }>;
  /**
   * @deprecated Pass `className` and `Title` instead. Sets their defaults for the channel or the
   * thread list. Removed in the next major.
   */
  listType?: 'channel' | 'thread';
  /**
   * The button that queries the first page again. Defaults to a "Try again" button with a spinner
   * while the retry runs.
   */
  RetryButton?: ComponentType<ListLoadErrorRetryButtonProps>;
  /** The explanation. Defaults to "Couldn't load the list". */
  Title?: ComponentType;
};

const DefaultTitle = () => {
  const { t } = useTranslationContext();
  return <>{t('listStates.loadError.text', "Couldn't load the list")}</>;
};

// TODO(next major): remove with the deprecated `listType` prop. The channel and thread lists pass
// their own `Title` and `className`.
const deprecatedListTypeTitles: Record<
  NonNullable<ListLoadErrorUIComponentProps['listType']>,
  ComponentType
> = {
  channel: function ChannelListTitle() {
    const { t } = useTranslationContext();
    return <>{t('channelList.loadError.text', "Couldn't load conversations")}</>;
  },
  thread: function ThreadListTitle() {
    const { t } = useTranslationContext();
    return <>{t('threadList.loadError.text', "Couldn't load threads")}</>;
  },
};

/** A "Try again" button that shows a spinner and keeps focus while the retry runs. */
const DefaultRetryButton = ({ isRetrying, retry }: ListLoadErrorRetryButtonProps) => {
  const { t } = useTranslationContext();
  return (
    // aria-disabled, not disabled: a disabled button would lose focus.
    <Button
      appearance='outline'
      aria-busy={isRetrying}
      aria-disabled={isRetrying}
      className='str-chat__list-load-error__retry-button'
      onClick={retry}
      size='md'
      variant='secondary'
    >
      {isRetrying && <LoadingIndicator />}
      {t('common.tryAgain.label', 'Try again')}
    </Button>
  );
};

/**
 * Shown in place of a list whose first page failed to load: an icon, a short explanation and a
 * button that queries the first page again.
 */
export const ListLoadErrorUI = ({
  className,
  Icon,
  isRetrying,
  listType,
  retry,
  RetryButton = DefaultRetryButton,
  Title = listType ? deprecatedListTypeTitles[listType] : DefaultTitle,
}: ListLoadErrorUIComponentProps) => {
  const { IconExclamationMark } = useComponentContextIcons();
  const ResolvedIcon = Icon ?? IconExclamationMark;

  return (
    <div
      className={clsx(
        'str-chat__list-load-error',
        listType && `str-chat__${listType}-list-load-error`,
        className,
      )}
    >
      <ResolvedIcon className='str-chat__list-load-error__icon' />
      <div className='str-chat__list-load-error__content'>
        <p className='str-chat__list-load-error__title'>
          <Title />
        </p>
        <RetryButton isRetrying={isRetrying} retry={retry} />
      </div>
    </div>
  );
};
