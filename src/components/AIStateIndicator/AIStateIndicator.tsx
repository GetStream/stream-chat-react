import React from 'react';

import { Channel } from 'stream-chat';

import { AIStates, useAIState } from './hooks/useAIState';

import { useChannelStateContext, useTranslationContext } from '../../context';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type AIStateIndicatorProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  channel?: Channel<StreamChatGenerics>;
};

export const AIStateIndicator = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  channel: channelFromProps,
}: AIStateIndicatorProps<StreamChatGenerics>) => {
  const { t } = useTranslationContext();
  const { channel: channelFromContext } = useChannelStateContext<StreamChatGenerics>(
    'AIStateIndicator',
  );
  const channel = channelFromProps || channelFromContext;
  const { aiState } = useAIState(channel);
  const allowedStates = {
    [AIStates.Thinking]: t('Thinking...'),
    [AIStates.Generating]: t('Generating...'),
  };

  return aiState in allowedStates ? (
    <div className='str-chat__ai-state-indicator-container'>
      <p className='str-chat__ai-state-indicator-text'>{allowedStates[aiState]}</p>
    </div>
  ) : null;
};
