import React from 'react';
import { useChatContext, useMessageContext, useTranslationContext } from '../../context';
import type { BaseContextMenuButtonProps } from '../Dialog';
import {
  ContextMenuBackButton,
  ContextMenuButton,
  ContextMenuHeader,
  useContextMenuContext,
} from '../Dialog';
import { IconBellNotification, IconChevronLeft } from '../Icons';

// todo: do we need to have isMine as a prop?
export type RemindMeActionButtonProps = { isMine: boolean } & BaseContextMenuButtonProps;

export const RemindMeActionButton = ({
  className,
  isMine: _, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...props
}: RemindMeActionButtonProps) => {
  const { t } = useTranslationContext();

  return (
    <ContextMenuButton
      aria-selected='false'
      className={className}
      Icon={IconBellNotification}
      {...props}
    >
      {t('Remind Me')}
    </ContextMenuButton>
  );
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
          onClick={() => {
            client.reminders.upsertReminder({
              messageId: message.id,
              remind_at: new Date(new Date().getTime() + offsetMs).toISOString(),
            });
            closeMenu();
          }}
        >
          {t('duration/Remind Me', { milliseconds: offsetMs })}
        </ContextMenuButton>
      ))}
      {/* todo: potential improvement to add a custom option that would trigger rendering modal with custom date picker - we need date picker */}
    </div>
  );
};
