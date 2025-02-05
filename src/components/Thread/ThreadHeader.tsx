import React from 'react';

import {
  ChannelPreviewInfoParams,
  useChannelPreviewInfo,
} from '../ChannelPreview/hooks/useChannelPreviewInfo';
import { CloseIcon } from './icons';

import { StreamMessage, useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';

export type ThreadHeaderProps = {
  /** Callback for closing the thread */
  closeThread: (event?: React.BaseSyntheticEvent) => void;
  /** The thread parent message */
  thread: StreamMessage;
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
        <div className='str-chat__thread-header-title'>{t<string>('Thread')}</div>
        <div className='str-chat__thread-header-subtitle'>{displayTitle}</div>
      </div>
      <button
        aria-label={t('aria/Close thread')}
        className='str-chat__close-thread-button'
        data-testid='close-button'
        onClick={closeThread}
      >
        <CloseIcon />
      </button>
    </div>
  );
};
