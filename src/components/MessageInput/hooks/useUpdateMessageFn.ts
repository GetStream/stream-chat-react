import { useCallback } from 'react';
import {
  useChannelStateContext,
  useMessageComposer,
  useMessageContext,
  useThreadContext,
  useTranslationContext,
} from '../../..';

export const useUpdateMessageFn = () => {
  const { channel } = useChannelStateContext();
  const thread = useThreadContext();
  const messageComposer = useMessageComposer();
  const { clearEditingState } = useMessageContext();
  const { t } = useTranslationContext('useUpdateMessageFn');

  return useCallback(async () => {
    const composition = await messageComposer.compose();
    if (!composition || !composition.message) return;

    const { localMessage, sendOptions } = composition;
    try {
      if (thread) {
        await thread.updateMessageWithLocalUpdate({ localMessage, options: sendOptions });
      } else {
        await channel.updateMessageWithLocalUpdate({
          localMessage,
          options: sendOptions,
        });
      }
      // todo: find way to avoid having control of editing state in MessageContext and MessageInputContext
      clearEditingState();
    } catch (error) {
      channel.getClient().notifications.addError({
        message: t('Edit message request failed'),
        // todo: Register notification translator
        options: {
          metadata: {
            reason: (error as Error).message,
          },
          originalError: error instanceof Error ? error : undefined,
          type: 'api:message:update:failed',
        },
        origin: {
          context: { messageComposer },
          emitter: 'useUpdateMessageFn',
        },
      });
    }
  }, [channel, clearEditingState, messageComposer, t, thread]);
};
