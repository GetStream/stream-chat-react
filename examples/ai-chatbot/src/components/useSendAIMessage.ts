'use client';

import { useCallback } from 'react';
import type { Channel } from 'stream-chat';
import {
  useChannelActionContext,
  useChannelStateContext,
  useMessageComposerController,
} from 'stream-chat-react';
import { startAiAgent, summarizeConversation } from '@/components/api';
import { recordMessage } from '@/components/rateLimitUtils';

export const availableModels = [
  { platform: 'openai', value: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
  { platform: 'openai', value: 'gpt-5.4-nano', label: 'GPT-5.4 nano' },
  {
    platform: 'gemini',
    value: 'gemini-flash-latest',
    label: 'Gemini Flash (latest)',
  },
] as const;

export const defaultPlatformModel = `${availableModels[0].platform}|${availableModels[0].value}`;

export const isWatchedByAI = (channel: Channel) =>
  Object.keys(channel.state.watchers).some((watcher) => watcher.startsWith('ai-bot'));

type SendAIMessageOptions = {
  text: string;
  /** `platform|model`, as the model select submits it. */
  platformModel?: string;
  /** Called once the message is composed, before the agent is started and it is sent. */
  onComposed?: () => void;
};

/**
 * Sends a message to the AI agent: composes it (with any attachments), starts the agent on the
 * channel if it isn't watching yet, sends it, records it against the rate limit and gives a new
 * conversation its summary. Shared by the composer and voice mode.
 *
 * Resolves to whether a message was sent.
 */
export const useSendAIMessage = () => {
  const { updateMessage, sendMessage } = useChannelActionContext();
  const { channel } = useChannelStateContext();
  const composer = useMessageComposerController();

  return useCallback(
    async ({
      text,
      platformModel = defaultPlatformModel,
      onComposed,
    }: SendAIMessageOptions) => {
      composer.textComposer.setText(text);

      const composedData = await composer.compose();

      if (!composedData) return false;

      onComposed?.();
      composer.clear();

      updateMessage(composedData.localMessage);

      if (!channel.initialized) {
        await channel.watch();
      }

      const [platform, model] = platformModel.split('|');

      if (!isWatchedByAI(channel)) {
        await startAiAgent(channel, model, platform);
      }

      await sendMessage(composedData);

      recordMessage(channel.id!);

      if (typeof channel.data?.summary !== 'string' || !channel.data.summary.length) {
        const summary = await summarizeConversation(text).catch(() => {
          console.warn('Failed to summarize conversation');
          return null;
        });

        if (typeof summary === 'string' && summary.length > 0) {
          await channel.update({ summary });
        }
      }

      return true;
    },
    [channel, composer, sendMessage, updateMessage],
  );
};
