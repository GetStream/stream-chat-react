import React from 'react';

import { Channel } from 'stream-chat';

import { AIStates, useAIState } from './hooks/useAIState';

import { useChannelStateContext, useTranslationContext } from '../../context';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type AIGenerationIndicatorProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  channel?: Channel<StreamChatGenerics>;
};

export const AIGenerationIndicator = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  channel: channelFromProps,
}: AIGenerationIndicatorProps<StreamChatGenerics>) => {
  const { t } = useTranslationContext();
  const { channel: channelFromContext } = useChannelStateContext<StreamChatGenerics>(
    'AIGenerationIndicator',
  );
  const channel = channelFromProps || channelFromContext;
  const { aiState } = useAIState(channel);
  const allowedStates = {
    [AIStates.Thinking]: t('Thinking...'),
    [AIStates.Generating]: t('Generating...'),
  };

  return aiState in allowedStates ? (
    <div className='str-chat__ai-typing-indicator-container'>
      <p className='str-chat__ai-typing-indicator-text'>{allowedStates[aiState]}</p>
    </div>
  ) : null;
};