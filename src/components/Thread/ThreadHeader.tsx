import React from 'react';

import { useChannelPreviewInfo } from '../ChannelPreview/hooks/useChannelPreviewInfo';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { ChannelPreviewInfoParams } from '../ChannelPreview/hooks/useChannelPreviewInfo';
import type { LocalMessage } from 'stream-chat';
import { Button } from '../Button';
import { IconCrossMedium } from '../Icons';

export type ThreadHeaderProps = {
  /** Callback for closing the thread */
  closeThread: (event?: React.BaseSyntheticEvent) => void;
  /** The thread parent message */
  thread: LocalMessage;
};

export const ThreadHeader = (
  props: ThreadHeaderProps &
    Pick<ChannelPreviewInfoParams, 'overrideImage' | 'overrideTitle'>,
) => {
  const { closeThread, overrideImage, overrideTitle } = props;

  const { t } = useTranslationContext('ThreadHeader');
  const { channel } = useChannelStateContext('');
  const { displayTitle } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });

  return (
    <div className='str-chat__thread-header'>
      <div className='str-chat__thread-header-details'>
        <div className='str-chat__thread-header-title'>{t('Thread')}</div>
        <div className='str-chat__thread-header-subtitle'>{displayTitle}</div>
      </div>
      <Button
        appearance='ghost'
        aria-label={t('aria/Close thread')}
        circular
        className='str-chat__close-thread-button'
        data-testid='close-thread-button'
        onClick={closeThread}
        size='md'
        variant='secondary'
      >
        <IconCrossMedium />
      </Button>
    </div>
  );
};
