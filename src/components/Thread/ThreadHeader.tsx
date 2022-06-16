import React from 'react';

import { Avatar } from '../Avatar';
import {
  ChannelPreviewInfoParams,
  useChannelPreviewInfo,
} from '../ChannelPreview/hooks/useChannelPreviewInfo';

import { StreamMessage, useChannelStateContext, useTranslationContext } from '../../context';

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
        <svg height='10' width='10' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z'
            fillRule='evenodd'
          />
        </svg>
      </button>
    </div>
  );
};
