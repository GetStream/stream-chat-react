import React from 'react';

import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

export type NewMessageNotificationProps = {
  /** Pre-computed label text (passed to custom override) */
  label?: string;
  /** Controls the notification display */
  showNotification?: boolean;
  /** Number of new messages since user scrolled up (optional; when provided shows "{{count}} new messages") */
  newMessageCount?: number;
};

const UnMemoizedNewMessageNotification = (props: NewMessageNotificationProps) => {
  const { newMessageCount = 0, showNotification } = props;

  const { t } = useTranslationContext();

  const { NewMessageNotification: CustomNewMessageNotification } = useComponentContext();

  if (!showNotification) return null;

  const label =
    newMessageCount > 0
      ? t('{{count}} new messages', { count: newMessageCount })
      : t('New Messages!');

  if (CustomNewMessageNotification) {
    return <CustomNewMessageNotification {...props} label={label} />;
  }

  return (
    <div className='str-chat__new-message-notification'>
      <div
        aria-live='polite'
        className='str-chat__message-notification__label'
        data-testid='message-notification'
      >
        {label}
      </div>
    </div>
  );
};

export const NewMessageNotification = React.memo(
  UnMemoizedNewMessageNotification,
) as typeof UnMemoizedNewMessageNotification;
