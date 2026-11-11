import React, { Fragment, useMemo } from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { ContextMenuButton, useContextMenuContext } from '../Dialog';
import { ScheduledMessageAction } from './constants';
import type { ScheduledMessageActionsMenuProps } from './types';

export const ScheduledMessageActionsMenu = ({
  actions,
  onCopy,
  onDelete,
  onEdit,
  onReschedule,
  onSendNow,
}: ScheduledMessageActionsMenuProps) => {
  const { t } = useTranslationContext();
  const { IconClock, IconCopy, IconDelete, IconEdit, IconSend } =
    useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();

  const menuItems = useMemo(
    () => ({
      [ScheduledMessageAction.Copy]: {
        Icon: IconCopy,
        label: t('Copy text'),
        onSelect: onCopy,
      },
      [ScheduledMessageAction.Delete]: {
        Icon: IconDelete,
        label: t('Delete'),
        onSelect: onDelete,
      },
      [ScheduledMessageAction.Edit]: {
        Icon: IconEdit,
        label: t('Edit & reschedule'),
        onSelect: onEdit,
      },
      [ScheduledMessageAction.Reschedule]: {
        Icon: IconClock,
        label: t('Reschedule'),
        onSelect: onReschedule,
      },
      [ScheduledMessageAction.SendNow]: {
        Icon: IconSend,
        label: t('Send now'),
        onSelect: onSendNow,
      },
    }),
    [
      IconClock,
      IconCopy,
      IconDelete,
      IconEdit,
      IconSend,
      onCopy,
      onDelete,
      onEdit,
      onReschedule,
      onSendNow,
      t,
    ],
  );

  return (
    <>
      {actions.map((action, index) => {
        const { Icon, label, onSelect } = menuItems[action];
        const isDelete = action === ScheduledMessageAction.Delete;
        const hasSeparator = isDelete && index > 1;

        const selectAction = () => {
          closeMenu();
          onSelect();
        };

        return (
          <Fragment key={action}>
            {hasSeparator && (
              <div
                className='str-chat__scheduled-message-actions-menu__separator'
                role='separator'
              />
            )}
            <ContextMenuButton
              className='str-chat__scheduled-message-actions-menu__item'
              data-testid={`scheduled-message-action-${action}`}
              Icon={Icon}
              onClick={selectAction}
              variant={isDelete ? 'destructive' : undefined}
            >
              {label}
            </ContextMenuButton>
          </Fragment>
        );
      })}
    </>
  );
};
