import React from 'react';

import { Avatar as DefaultAvatar } from '../Avatar';
import {
  ChannelPreviewInfoParams,
  useChannelPreviewInfo,
} from '../ChannelPreview/hooks/useChannelPreviewInfo';
import { CloseIcon } from './icons';

import { StreamMessage, useChannelStateContext } from '../../context/ChannelStateContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type ThreadHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  closeThread: (event: React.BaseSyntheticEvent) => void;
  thread: StreamMessage<StreamChatGenerics>;
};

export const ThreadHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ThreadHeaderProps<StreamChatGenerics> &
    Pick<ChannelPreviewInfoParams<StreamChatGenerics>, 'overrideImage' | 'overrideTitle'>,
) => {
  const { closeThread, overrideImage, overrideTitle } = props;

  const { Avatar = DefaultAvatar } = useComponentContext('ThreadHeader');
  const { t } = useTranslationContext('ThreadHeader');
  const { channel } = useChannelStateContext<StreamChatGenerics>('');
  const { displayImage, displayTitle } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });

  return (
    <div className='str-chat__thread-header'>
      <Avatar image={displayImage} name={displayTitle} shape='rounded' size={40} />
      <div className='str-chat__thread-header-details'>
        <div className='str-chat__thread-header-title'>{t<string>('Thread')}</div>
        <div className='str-chat__thread-header-subtitle'>{displayTitle}</div>
      </div>
      <button
        aria-label='Close thread'
        className='str-chat__square-button str-chat__close-thread-button'
        data-testid='close-button'
        onClick={(event) => closeThread(event)}
      >
        <CloseIcon />
      </button>
    </div>
  );
};
