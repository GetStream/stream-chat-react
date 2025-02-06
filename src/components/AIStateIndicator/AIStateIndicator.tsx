import React from 'react';
import type { Channel } from 'stream-chat';

import { AIStates, useAIState } from './hooks/useAIState';

import { useChannelStateContext, useTranslationContext } from '../../context';

export type AIStateIndicatorProps = {
  channel?: Channel;
};

export const AIStateIndicator = ({
  channel: channelFromProps,
}: AIStateIndicatorProps) => {
  const { t } = useTranslationContext();
  const { channel: channelFromContext } = useChannelStateContext('AIStateIndicator');
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
