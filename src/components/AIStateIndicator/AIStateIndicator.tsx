import React from 'react';
import { AIStates } from 'stream-chat';
import type { AIState, Channel } from 'stream-chat';

import { useAIState } from './hooks/useAIState';

import { useChannel, useTranslationContext } from '../../context';

export type AIStateIndicatorProps = {
  channel?: Channel;
};

export const AIStateIndicator = ({
  channel: channelFromProps,
}: AIStateIndicatorProps) => {
  const { t } = useTranslationContext();
  const channelFromContext = useChannel();
  const channel = channelFromProps || channelFromContext;
  const { aiState } = useAIState(channel);
  const allowedStates: Partial<Record<AIState, string>> = {
    [AIStates.Thinking]: t('aiState.indicator.thinking.label', 'Thinking...'),
    [AIStates.Generating]: t('aiState.indicator.generating.label', 'Generating...'),
  };

  return aiState in allowedStates ? (
    <div className='str-chat__ai-state-indicator-container'>
      <p className='str-chat__ai-state-indicator-text'>{allowedStates[aiState]}</p>
    </div>
  ) : null;
};
