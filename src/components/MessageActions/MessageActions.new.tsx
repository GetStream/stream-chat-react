/* eslint-disable sort-keys */
import clsx from 'clsx';
import React, { ComponentPropsWithoutRef, PropsWithChildren, useMemo, useState } from 'react';

import { ReactionSelectorWithButton } from '../Reactions/ReactionSelectorWithButton';
import {
  useChannelActionContext,
  useChatContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import { ActionsIcon, ReactionIcon as DefaultReactionIcon, ThreadIcon } from '../Message/icons';
import { ACTIONS_NOT_WORKING_IN_THREAD, isUserMuted } from '../Message/utils';
import { useUserRole } from '../Message/hooks';
import { DialogAnchor, useDialog, useDialogIsOpen } from '../Dialog';
import { MessageActionsWrapper } from './MessageActions';

export type MessageAction = {
  Component: React.ComponentType;
  placement: 'quick' | 'dropdown';
  type:
    | 'reply'
    | 'react'
    | 'block'
    | 'delete'
    | 'edit'
    | 'mute'
    | 'flag'
    | 'pin'
    | 'quote'
    | 'markAsUnread'
    // eslint-disable-next-line @typescript-eslint/ban-types
    | (string & {});
};

const DefaultMessageActionComponents = {
  dropdown: {
    Quote() {
      const { setQuotedMessage } = useChannelActionContext();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();

      const handleQuote = () => {
        setQuotedMessage(message);

        const elements = message.parent_id
          ? document.querySelectorAll('.str-chat__thread .str-chat__textarea__textarea')
          : document.getElementsByClassName('str-chat__textarea__textarea');
        const textarea = elements.item(0);

        if (textarea instanceof HTMLTextAreaElement) {
          textarea.focus();
        }
      };

      return (
        <DefaultDropdownActionButton onClick={handleQuote}>
          {t<string>('Quote')}
        </DefaultDropdownActionButton>
      );
    },
    Pin() {
      const { handlePin, message } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton onClick={handlePin}>
          {!message.pinned ? t<string>('Pin') : t<string>('Unpin')}
        </DefaultDropdownActionButton>
      );
    },
    MarkAsUnread() {
      const { handleMarkUnread } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton onClick={handleMarkUnread}>
          {t<string>('Mark as unread')}
        </DefaultDropdownActionButton>
      );
    },
    Flag() {
      const { handleFlag } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton onClick={handleFlag}>
          {t<string>('Flag')}
        </DefaultDropdownActionButton>
      );
    },
    Mute() {
      const { handleMute, message } = useMessageContext();
      const { mutes } = useChatContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton onClick={handleMute}>
          {isUserMuted(message, mutes) ? t<string>('Unmute') : t<string>('Mute')}
        </DefaultDropdownActionButton>
      );
    },
    Edit() {
      const { handleEdit } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton onClick={handleEdit}>
          {t<string>('Edit Message')}
        </DefaultDropdownActionButton>
      );
    },
    Delete() {
      const { handleDelete } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton onClick={handleDelete}>
          {t<string>('Delete')}
        </DefaultDropdownActionButton>
      );
    },
  },
  quick: {
    React() {
      return <ReactionSelectorWithButton ReactionIcon={DefaultReactionIcon} />;
    },
    Reply() {
      const { handleOpenThread } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <button
          aria-label={t('aria/Open Thread')}
          className='str-chat__message-reply-in-thread-button'
          data-testid='thread-action'
          onClick={handleOpenThread}
        >
          <ThreadIcon className='str-chat__message-action-icon' />
        </button>
      );
    },
  },
};

export const defaultMessageActionSet: MessageAction[] = [
  { Component: DefaultMessageActionComponents.quick.Reply, placement: 'quick', type: 'reply' },
  { Component: DefaultMessageActionComponents.quick.React, placement: 'quick', type: 'react' },
  //   { placement: 'dropdown', type: 'block' },
  {
    Component: DefaultMessageActionComponents.dropdown.Delete,
    placement: 'dropdown',
    type: 'delete',
  },
  { Component: DefaultMessageActionComponents.dropdown.Edit, placement: 'dropdown', type: 'edit' },
  { Component: DefaultMessageActionComponents.dropdown.Mute, placement: 'dropdown', type: 'mute' },
  { Component: DefaultMessageActionComponents.dropdown.Flag, placement: 'dropdown', type: 'flag' },
  { Component: DefaultMessageActionComponents.dropdown.Pin, placement: 'dropdown', type: 'pin' },
  {
    Component: DefaultMessageActionComponents.dropdown.Quote,
    placement: 'dropdown',
    type: 'quote',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.MarkAsUnread,
    placement: 'dropdown',
    type: 'markAsUnread',
  },
] as const;

export const DefaultDropdownActionButton = ({
  'aria-selected': ariaSelected = 'false',
  children,
  className = 'str-chat__message-actions-list-item-button',
  role = 'option',
  ...rest
}: ComponentPropsWithoutRef<'button'>) => (
  <button aria-selected={ariaSelected} className={className} role={role} {...rest}>
    {children}
  </button>
);

/**
 * Base filter hook which covers actions of type `delete`, `edit`,
 * `flag`, `markAsUnread`, `mute`, `quote`, `react` and `reply` and whether
 * the rendered message is a reply (replies are limited to certain actions).
 */
export const useBaseMessageActionSetFilter = (
  messageActionSet: MessageAction[],
  disable = false,
) => {
  const { initialMessage: isInitialMessage, message } = useMessageContext();
  const {
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canQuote,
    canReact,
    canReply,
  } = useUserRole(message);
  const isMessageThreadReply = typeof message.parent_id === 'string';

  return useMemo(() => {
    if (disable) return messageActionSet;

    // filter out all actions if any of these are true
    if (
      isInitialMessage || // not sure whether this thing even works anymore
      !message.type ||
      message.type === 'error' ||
      message.type === 'system' ||
      message.type === 'ephemeral' ||
      message.status === 'failed' ||
      message.status === 'sending'
    )
      return [];

    return messageActionSet.filter(({ type }: MessageAction) => {
      // filter out actions with types that do not work in thread
      if (ACTIONS_NOT_WORKING_IN_THREAD.includes(type) && isMessageThreadReply) return false;

      if (
        (type === 'delete' && !canDelete) ||
        (type === 'edit' && !canEdit) ||
        (type === 'flag' && !canFlag) ||
        (type === 'markAsUnread' && !canMarkUnread) ||
        (type === 'mute' && !canMute) ||
        (type === 'quote' && !canQuote) ||
        (type === 'react' && !canReact) ||
        (type === 'reply' && !canReply)
      )
        return false;

      return true;
    });
  }, [
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canQuote,
    canReact,
    canReply,
    isInitialMessage,
    isMessageThreadReply,
    message.status,
    message.type,
    disable,
    messageActionSet,
  ]);
};

export const useSplitMessageActionSet = (messageActionSet: MessageAction[]) =>
  useMemo(() => {
    const quickActionSet: MessageAction[] = [];
    const dropdownActionSet: MessageAction[] = [];

    for (const action of messageActionSet) {
      if (action.placement === 'quick') quickActionSet.push(action);
      if (action.placement === 'dropdown') dropdownActionSet.push(action);
    }

    return { quickActionSet, dropdownActionSet } as const;
  }, [messageActionSet]);

export const MessageActions = ({
  disableBaseMessageActionSetFilter = false,
  messageActionSet = defaultMessageActionSet,
}: {
  disableBaseMessageActionSetFilter?: boolean;
  messageActionSet?: MessageAction[];
}) => {
  const { theme } = useChatContext();
  const { isMyMessage, message } = useMessageContext();
  const { t } = useTranslationContext();
  const [actionsBoxButtonElement, setActionsBoxButtonElement] = useState<HTMLButtonElement | null>(
    null,
  );

  const filteredMessageActionSet = useBaseMessageActionSetFilter(
    messageActionSet,
    disableBaseMessageActionSetFilter,
  );

  const { dropdownActionSet, quickActionSet } = useSplitMessageActionSet(filteredMessageActionSet);

  const dropdownDialogId = `message-actions--${message.id}`;
  const reactionSelectorDialogId = `reaction-selector--${message.id}`;
  const dialog = useDialog({ id: dropdownDialogId });
  const dropdownDialogIsOpen = useDialogIsOpen(dropdownDialogId);
  const reactionSelectorDialogIsOpen = useDialogIsOpen(reactionSelectorDialogId);

  // do not render anything if total action count is zero
  if (dropdownActionSet.length + quickActionSet.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(`str-chat__message-${theme}__actions str-chat__message-options`, {
        'str-chat__message-options--active': dropdownDialogIsOpen || reactionSelectorDialogIsOpen,
      })}
    >
      {dropdownActionSet.length > 0 && (
        <MessageActionsWrapper inline={false} toggleOpen={dialog?.toggle}>
          <button
            aria-expanded={dropdownDialogIsOpen}
            aria-haspopup='true'
            aria-label={t('aria/Open Message Actions Menu')}
            className='str-chat__message-actions-box-button'
            data-testid='message-actions-toggle-button'
            ref={setActionsBoxButtonElement}
          >
            <ActionsIcon className='str-chat__message-action-icon' />
          </button>

          <DialogAnchor
            id={dropdownDialogId}
            placement={isMyMessage() ? 'top-end' : 'top-start'}
            referenceElement={actionsBoxButtonElement}
            trapFocus
          >
            <DropdownBox open={dropdownDialogIsOpen}>
              {dropdownActionSet.map(({ Component: DropdownActionComponent, type }) => (
                <DropdownActionComponent key={type} />
              ))}
            </DropdownBox>
          </DialogAnchor>
        </MessageActionsWrapper>
      )}
      {quickActionSet.map(({ Component: QuickActionComponent, type }) => (
        <QuickActionComponent key={type} />
      ))}
    </div>
  );
};

const DropdownBox = ({ children, open }: PropsWithChildren<{ open: boolean }>) => {
  const { t } = useTranslationContext();
  return (
    <div
      className={clsx('str-chat__message-actions-box', {
        'str-chat__message-actions-box--open': open,
      })}
    >
      <div
        aria-label={t('aria/Message Options')}
        className='str-chat__message-actions-list'
        role='listbox'
      >
        {children}
      </div>
    </div>
  );
};
