import React from 'react';

import {
  ChannelPreviewInfoParams,
  useChannelPreviewInfo,
} from '../ChannelPreview/hooks/useChannelPreviewInfo';
import { CloseIcon } from './icons';

import { StreamMessage, useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type ThreadHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Callback for closing the thread */
  closeThread: (event?: React.BaseSyntheticEvent) => void;
  /** The thread parent message */
  thread: StreamMessage<StreamChatGenerics>;
};

export const ThreadHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ThreadHeaderProps<StreamChatGenerics> &
    Pick<ChannelPreviewInfoParams<StreamChatGenerics>, 'overrideImage' | 'overrideTitle'>,
) => {
  const { closeThread, overrideImage, overrideTitle } = props;

  const { t } = useTranslationContext('ThreadHeader');
  const { channel } = useChannelStateContext<StreamChatGenerics>('');
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
        aria-label='Close thread'
        className='str-chat__square-button str-chat__close-thread-button'
        data-testid='close-button'
        onClick={closeThread}
      >
        <CloseIcon />
      </button>
    </div>
  );
};
