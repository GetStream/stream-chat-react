'use client';

import { useCallback } from 'react';
import type { Channel, MessageComposer } from 'stream-chat';
import { useChannel, useMessageComposerController } from 'stream-chat-react';
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
  /** Called once the composer has taken the message (it was sent or failed to send). */
  onComposed?: () => void;
  /**
   * The composer to send through. Defaults to the one the message composer UI is bound to; voice
   * mode passes its own, so a spoken turn neither replaces the typed draft nor sends its attachments.
   */
  composer?: MessageComposer;
};

/**
 * Sends a message to the AI agent: creates a new conversation on the server, starts the agent on
 * the channel if it isn't watching yet, sends the message (with any attachments), records it
 * against the rate limit and gives a new conversation its summary in the background. Shared by
 * the composer and voice mode.
 *
 * Resolves to whether a message was sent, as soon as it was: the summary never delays or fails it.
 */
export const useSendAIMessage = () => {
  const channel = useChannel();
  const boundComposer = useMessageComposerController();

  return useCallback(
    async ({
      text,
      platformModel = defaultPlatformModel,
      onComposed,
      composer = boundComposer,
    }: SendAIMessageOptions) => {
      composer.textComposer.setText(text);

      // A new conversation exists only locally until now; `Channel` no longer creates it.
      // Both setup steps run before `send()`, so a failure here leaves the draft untouched.
      if (!channel.initialized) {
        await channel.ensureWatched();
      }

      const [platform, model] = platformModel.split('|');

      if (!isWatchedByAI(channel)) {
        await startAiAgent(channel, model, platform);
      }

      // `send()` composes the message, shows it optimistically, releases the composer and
      // reports a failed send itself (the message stays in the list marked `failed`).
      const result = await composer.send();

      // `nothing-to-send` keeps the composer's contents (e.g. an upload is still running).
      if (result === 'nothing-to-send') return false;

      onComposed?.();

      if (result !== 'sent') return false;

      recordMessage(channel.id!);

      if (!channel.data?.custom?.summary) {
        summarizeConversation(text)
          .then((summary) =>
            typeof summary === 'string' && summary.length > 0
              ? channel.update({ data: { custom: { summary } } })
              : undefined,
          )
          .catch(() => console.warn('Failed to summarize conversation'));
      }

      return true;
    },
    [boundComposer, channel],
  );
};
