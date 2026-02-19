import clsx from 'clsx';
import React, { useMemo, useState } from 'react';

import { useChatContext, useMessageContext, useTranslationContext } from '../../context';
import {
  ContextMenu,
  type ContextMenuItemComponent,
  type ContextMenuItemProps,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../Dialog';
import { useBaseMessageActionSetFilter, useSplitMessageActionSet } from './hooks';
import { defaultMessageActionSet } from './defaults';
import { ActionsIcon, type MESSAGE_ACTIONS } from '../Message';
import { Button } from '../Button';

type BaseMessageActionSetItem = {
  placement: 'quick' | 'dropdown';
  type: keyof typeof MESSAGE_ACTIONS | (string & {});
};

export type QuickMessageActionSetItem = BaseMessageActionSetItem & {
  Component: React.ComponentType;
  placement: 'quick';
};

export type DropdownMessageActionSetItem = BaseMessageActionSetItem & {
  Component: React.ComponentType<ContextMenuItemProps>;
  placement: 'dropdown';
};

export type MessageActionSetItem =
  | QuickMessageActionSetItem
  | DropdownMessageActionSetItem;

export type MessageActionsProps = {
  disableBaseMessageActionSetFilter?: boolean;
  messageActionSet?: MessageActionSetItem[];
};

// TODO: allow passing down customWrapperClass
/**
 * A new actions component to replace current `MessageOptions` component.
 * Exports from `stream-chat-react/experimental` __MIGHT__ change - use with caution
 * and follow release notes in case you notice unexpected behavior.
 */
export const MessageActions = ({
  disableBaseMessageActionSetFilter = false,
  messageActionSet = defaultMessageActionSet,
}: MessageActionsProps) => {
  const { theme } = useChatContext();
  const { isMyMessage, message } = useMessageContext();
  const { t } = useTranslationContext();
  const [actionsBoxButtonElement, setActionsBoxButtonElement] =
    useState<HTMLSpanElement | null>(null);

  const filteredMessageActionSet = useBaseMessageActionSetFilter(
    messageActionSet,
    disableBaseMessageActionSetFilter,
  );

  const { dropdownActionSet, quickActionSet } = useSplitMessageActionSet(
    filteredMessageActionSet,
  );

  const dropdownDialogId = `message-actions--${message.id}`;
  const reactionSelectorDialogId = `reaction-selector--${message.id}`;
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dropdownDialogId });
  const dropdownDialogIsOpen = useDialogIsOpen(dropdownDialogId, dialogManager?.id);
  const reactionSelectorDialogIsOpen = useDialogIsOpen(
    reactionSelectorDialogId,
    dialogManager?.id,
  );

  const contextMenuItems = useMemo<ContextMenuItemComponent[]>(
    () =>
      dropdownActionSet.map(({ Component }) => {
        const ActionItem: ContextMenuItemComponent = (menuProps) => (
          <Component {...menuProps} />
        );
        return ActionItem;
      }),
    [dropdownActionSet],
  );

  // do not render anything if total action count is zero
  if (dropdownActionSet.length + quickActionSet.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(`str-chat__message-${theme}__actions str-chat__message-options`, {
        'str-chat__message-options--active':
          dropdownDialogIsOpen || reactionSelectorDialogIsOpen,
      })}
    >
      {dropdownActionSet.length > 0 && (
        <>
          <Button
            aria-expanded={dropdownDialogIsOpen}
            aria-haspopup='true'
            aria-label={t('aria/Open Message Actions Menu')}
            className={clsx(
              'str-chat__message-actions-box-button',
              'str-chat__button--ghost',
              'str-chat__button--secondary',
              'str-chat__button--circular',
            )}
            data-testid='message-actions-toggle-button'
            onClick={() => {
              dialog?.toggle();
            }}
            ref={setActionsBoxButtonElement}
          >
            <ActionsIcon className='str-chat__message-action-icon' />
          </Button>

          <ContextMenu
            backLabel={t('Back')}
            className={clsx('str-chat__message-actions-box', {
              'str-chat__message-actions-box--open': dropdownDialogIsOpen,
            })}
            dialogManagerId={dialogManager?.id}
            id={dropdownDialogId}
            items={contextMenuItems}
            onClose={dialog?.close}
            placement={isMyMessage() ? 'top-end' : 'top-start'}
            referenceElement={actionsBoxButtonElement}
            tabIndex={-1}
            trapFocus
          />
        </>
      )}
      {quickActionSet.map(({ Component: QuickActionComponent, type }) => (
        <QuickActionComponent key={type} />
      ))}
    </div>
  );
};
