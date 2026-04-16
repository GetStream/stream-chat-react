import clsx from 'clsx';
import React, { type ComponentPropsWithRef, useState } from 'react';

import {
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import {
  ContextMenu,
  type ContextMenuItemProps,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../Dialog';
import { useBaseMessageActionSetFilter } from './hooks';
import { defaultMessageActionSet } from './MessageActions.defaults';
import { type MESSAGE_ACTIONS } from '../Message';
import { ReactionSelector } from '../Reactions';
import { useSplitActionSet } from '../Chat/hooks/useSplitActionSet';

type BaseMessageActionSetItem = {
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

export type QuickDropdownToggleActionSetItem = {
  Component: React.ComponentType<ComponentPropsWithRef<'button'>>;
  placement: 'quick-dropdown-toggle';
};

export type MessageActionSetItem =
  | QuickMessageActionSetItem
  | DropdownMessageActionSetItem
  | QuickDropdownToggleActionSetItem;

export type MessageActionsProps = {
  disableBaseMessageActionSetFilter?: boolean;
  messageActionSet?: MessageActionSetItem[];
};

interface MessageActionsInterface {
  (props: MessageActionsProps): React.ReactNode;
  getDialogId: (_: { messageId: string }) => string;
  displayName: string;
}

/**
 * A new actions component to replace current `MessageOptions` component.
 * Exports from `stream-chat-react/experimental` __MIGHT__ change - use with caution
 * and follow release notes in case you notice unexpected behavior.
 */
export const MessageActions: MessageActionsInterface = ({
  disableBaseMessageActionSetFilter = false,
  messageActionSet = defaultMessageActionSet,
}) => {
  const { isMyMessage, message, threadList } = useMessageContext();
  const { ContextMenu: ContextMenuComponent = ContextMenu } = useComponentContext();
  const { t } = useTranslationContext();
  const [actionsBoxButtonElement, setActionsBoxButtonElement] =
    useState<HTMLButtonElement | null>(null);

  const filteredMessageActionSet = useBaseMessageActionSetFilter(
    messageActionSet,
    disableBaseMessageActionSetFilter,
  );

  const { dropdownActionSet, quickActionSet, quickDropdownToggleAction } =
    useSplitActionSet(filteredMessageActionSet);

  const messageActionsDialogId = MessageActions.getDialogId({ messageId: message.id });
  const reactionSelectorDialogId = ReactionSelector.getDialogId({
    messageId: message.id,
    threadList,
  });
  const dropdownReactionSelectorDialogId = `${reactionSelectorDialogId}-dropdown`;
  const { dialog, dialogManager } = useDialogOnNearestManager({
    id: messageActionsDialogId,
  });
  const messageActionsDialogIsOpen = useDialogIsOpen(
    messageActionsDialogId,
    dialogManager?.id,
  );
  const reactionSelectorDialogIsOpen = useDialogIsOpen(
    reactionSelectorDialogId,
    dialogManager?.id,
  );
  const dropdownReactionSelectorDialogIsOpen = useDialogIsOpen(
    dropdownReactionSelectorDialogId,
    dialogManager?.id,
  );

  // do not render anything if total action count is zero
  if (dropdownActionSet.length + quickActionSet.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx('str-chat__message-options', {
        'str-chat__message-options--active':
          messageActionsDialogIsOpen ||
          reactionSelectorDialogIsOpen ||
          dropdownReactionSelectorDialogIsOpen,
      })}
    >
      {quickDropdownToggleAction && dropdownActionSet.length > 0 && (
        <>
          <quickDropdownToggleAction.Component ref={setActionsBoxButtonElement} />

          <ContextMenuComponent
            backLabel={t('Back')}
            className={clsx('str-chat__message-actions-box', {
              'str-chat__message-actions-box--hidden':
                dropdownReactionSelectorDialogIsOpen,
              'str-chat__message-actions-box--open': messageActionsDialogIsOpen,
            })}
            dialogManagerId={dialogManager?.id}
            id={messageActionsDialogId}
            onClose={dialog?.close}
            placement={isMyMessage() ? 'top-end' : 'top-start'}
            referenceElement={actionsBoxButtonElement}
            tabIndex={-1}
            trapFocus
          >
            {dropdownActionSet.map(({ Component, type }) => (
              <Component key={type} />
            ))}
          </ContextMenuComponent>
        </>
      )}
      {quickActionSet.map(({ Component: QuickActionComponent, type }) => (
        <QuickActionComponent key={type} />
      ))}
    </div>
  );
};

MessageActions.getDialogId = ({ messageId }) => `message-actions-${messageId}`;

MessageActions.displayName = 'MessageActions';
