import React from 'react';
import { useChatContext, useMessageContext, useTranslationContext } from '../../context';
import { useNotificationApi } from '../Notifications';
import {
  ContextMenuBackButton,
  ContextMenuButton,
  ContextMenuHeader,
  useContextMenuContext,
} from '../Dialog';
import { IconChevronLeft } from '../Icons';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const getNotificationError = (error: unknown): Error | undefined => {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message;
    if (typeof message === 'string') return new Error(message);
  }
  return undefined;
};

export const RemindMeSubmenuHeader = () => {
  const { t } = useTranslationContext();
  const { returnToParentMenu } = useContextMenuContext();
  return (
    <ContextMenuHeader>
      <ContextMenuBackButton onClick={returnToParentMenu}>
        <IconChevronLeft />
        <span>{t('Remind Me')}</span>
      </ContextMenuBackButton>
    </ContextMenuHeader>
  );
};

export const RemindMeSubmenu = () => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { message } = useMessageContext();
  const { closeMenu } = useContextMenuContext();
  const { addNotification } = useNotificationApi();
  return (
    <div
      aria-label={t('aria/Remind Me Options')}
      className='str-chat__message-actions-box__submenu'
      role='listbox'
    >
      {client.reminders.scheduledOffsetsMs.map((offsetMs) => (
        <ContextMenuButton
          className='str-chat__message-actions-list-item-button'
          key={`reminder-offset-option--${offsetMs}`}
          onClick={async () => {
            try {
              await client.reminders.upsertReminder({
                messageId: message.id,
                remind_at: new Date(new Date().getTime() + offsetMs).toISOString(),
              });
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                message: t('Reminder set'),
                severity: 'success',
                type: 'api:message:reminder:set:success',
              });
            } catch (error) {
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                error: getNotificationError(error),
                message: getErrorMessage(error, 'Error setting reminder'),
                severity: 'error',
                type: 'api:message:reminder:set:failed',
              });
            } finally {
              closeMenu();
            }
          }}
        >
          {t('duration/Remind Me', { milliseconds: offsetMs })}
        </ContextMenuButton>
      ))}
      {/* todo: potential improvement to add a custom option that would trigger rendering modal with custom date picker - we need date picker */}
    </div>
  );
};
