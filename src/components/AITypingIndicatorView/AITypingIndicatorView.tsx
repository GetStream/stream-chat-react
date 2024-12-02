import React from 'react';

import { Channel } from 'stream-chat';

import { AIStates, useAIState } from './hooks/useAIState';

import { useChannelStateContext, useTranslationContext } from '../../context';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type AITypingIndicatorViewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  channel?: Channel<StreamChatGenerics>;
};

export const AITypingIndicatorView = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  channel: channelFromProps,
}: AITypingIndicatorViewProps<StreamChatGenerics>) => {
  const { t } = useTranslationContext();
  const { channel: channelFromContext } = useChannelStateContext<StreamChatGenerics>(
    'AITypingIndicatorView',
  );
  const channel = channelFromProps || channelFromContext;
  const { aiState } = useAIState(channel);
  const allowedStates = {
    [AIStates.Thinking]: t('Thinking...'),
    [AIStates.Generating]: t('Generating...'),
  };

  return aiState in allowedStates ? (
    <div style={{ backgroundColor: 'gainsboro', padding: '0px 8px' }}>
      <p style={{ color: 'black' }}>{allowedStates[aiState]}</p>
    </div>
  ) : null;
};

AITypingIndicatorView.displayName = 'AITypingIndicatorView{messageSimple{content}}';
