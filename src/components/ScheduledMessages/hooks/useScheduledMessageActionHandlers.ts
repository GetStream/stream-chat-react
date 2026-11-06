import { useCallback, useState } from 'react';
import type { ScheduledMessageResponse } from 'stream-chat';

import { useChatContext, useTranslationContext } from '../../../context';
import { useIsMounted } from '../../Channel/hooks/useIsMounted';
import { useNotificationApi } from '../../Notifications';
import {
  SCHEDULED_MESSAGE_ACTIONS_EMITTER,
  ScheduledMessageNotificationType,
} from '../constants';
import type { ScheduledMessageActionHandlers } from '../types';
import { reloadOnScheduledMessageConflict } from '../utils';

export const useScheduledMessageActionHandlers = (
  scheduledMessage: ScheduledMessageResponse,
) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { addNotification } = useNotificationApi();
  const isMounted = useIsMounted();

  const [isPending, setIsPending] = useState(false);

  const { scheduledMessages: manager } = client;
  const { id, message } = scheduledMessage;
  const { text = '' } = message;

  const notifyFailure = useCallback(
    (error: Error, type: ScheduledMessageNotificationType, fallbackMessage: string) => {
      reloadOnScheduledMessageConflict(manager, error);

      addNotification({
        emitter: SCHEDULED_MESSAGE_ACTIONS_EMITTER,
        error,
        message: fallbackMessage,
        severity: 'error',
        type,
      });
    },
    [addNotification, manager],
  );

  const sendNow = useCallback(async () => {
    setIsPending(true);

    try {
      await manager.sendScheduledMessageNow(id);

      addNotification({
        emitter: SCHEDULED_MESSAGE_ACTIONS_EMITTER,
        message: t('scheduledMessages.scheduledMessageSent', 'Scheduled message sent'),
        severity: 'success',
        type: ScheduledMessageNotificationType.SendNowSucceeded,
      });
    } catch (error) {
      notifyFailure(
        error as Error,
        ScheduledMessageNotificationType.SendNowFailed,
        t(
          'scheduledMessages.couldntSendTheMessageTryAgain',
          "Couldn't send the message. Try again",
        ),
      );
    } finally {
      if (isMounted.current) setIsPending(false);
    }
  }, [addNotification, id, isMounted, manager, notifyFailure, t]);

  const deleteScheduledMessage = useCallback(async () => {
    setIsPending(true);

    try {
      await manager.deleteScheduledMessage(id);
    } catch (error) {
      notifyFailure(
        error as Error,
        ScheduledMessageNotificationType.DeleteFailed,
        t(
          'scheduledMessages.couldntDeleteTheScheduledMessageTryAgain',
          "Couldn't delete the scheduled message. Try again",
        ),
      );
    } finally {
      if (isMounted.current) setIsPending(false);
    }
  }, [id, isMounted, manager, notifyFailure, t]);

  const copyText = useCallback(() => {
    if (!text) return;

    navigator.clipboard?.writeText(text).catch(() => undefined);
  }, [text]);

  const scheduledMessageActionHandlers: ScheduledMessageActionHandlers = {
    copyText,
    deleteScheduledMessage,
    isPending,
    sendNow,
  };

  return scheduledMessageActionHandlers;
};
