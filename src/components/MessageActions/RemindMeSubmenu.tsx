import React from 'react';
import { useChatContext, useMessageContext, useTranslationContext } from '../../context';
import { ContextMenuButton } from '../Dialog';
import type { ComponentProps } from 'react';

export const RemindMeActionButton = ({
  className,
  isMine,
}: { isMine: boolean } & ComponentProps<'button'>) => {
  const { t } = useTranslationContext();

  return (
    <ContextMenuButton
      aria-selected='false'
      className={className}
      Submenu={RemindMeSubmenu}
      submenuPlacement={isMine ? 'left-start' : 'right-start'}
    >
      {t('Remind Me')}
    </ContextMenuButton>
  );
};

export const RemindMeSubmenu = () => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { message } = useMessageContext();
  return (
    <div
      aria-label={t('aria/Remind Me Options')}
      className='str-chat__message-actions-box__submenu'
      role='listbox'
    >
      {client.reminders.scheduledOffsetsMs.map((offsetMs) => (
        <button
          className='str-chat__message-actions-list-item-button'
          key={`reminder-offset-option--${offsetMs}`}
          onClick={() => {
            client.reminders.upsertReminder({
              messageId: message.id,
              remind_at: new Date(new Date().getTime() + offsetMs).toISOString(),
            });
          }}
        >
          {t('duration/Remind Me', { milliseconds: offsetMs })}
        </button>
      ))}
      {/* todo: potential improvement to add a custom option that would trigger rendering modal with custom date picker - we need date picker */}
    </div>
  );
};
