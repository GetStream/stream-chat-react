import clsx from 'clsx';
import React, { type ComponentPropsWithRef, useState } from 'react';
import type { LocalMessage } from 'stream-chat';

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
import { ReactionSelector } from '../Reactions';
import { useSplitActionSet } from '../Chat/hooks/useSplitActionSet';

/**
 * The action types {@link defaultMessageActionSet} ships, listed for autocomplete. Any string is
 * accepted, so custom actions name themselves.
 */
export type DefaultMessageActionType =
  | 'blockUser'
  | 'copyMessageText'
  | 'delete'
  | 'download'
  | 'edit'
  | 'flag'
  | 'markUnread'
  | 'mute'
  | 'pin'
  | 'quote'
  | 'react'
  | 'remindMe'
  | 'reply'
  | 'resendMessage'
  | 'saveForLater';

/** What an action's `isVisible` rule is checked against. */
export type MessageActionVisibilityFilterParams = {
  /** Whether the connected user sent the message. */
  isMyMessage: boolean;
  /** Whether the message is a thread reply. */
  isThreadReply: boolean;
  message: LocalMessage;
};

type BaseMessageActionSetItem = {
  /**
   * Hides the action for a message, e.g. `edit` for a poll. Cannot show an action the base filter
   * removes (capabilities, server features, message status). Shown when omitted.
   */
  isVisible?: (state: MessageActionVisibilityFilterParams) => boolean;
  type: DefaultMessageActionType | (string & {});
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
 * Renders a message's quick actions and its actions dropdown menu, or nothing when there are no
 * actions.
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
            aria-label={t('messageActions.messageActions.ariaLabel', 'Message Actions')}
            backLabel={t('common.back.label', 'Back')}
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
