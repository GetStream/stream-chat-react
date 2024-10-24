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

// 1. set of available actions
// const messageactions = {
//   quick: [{ type: 'reply' }, { type: 'react' }],
//   extended: [
//     { type: 'block' },
//     { type: 'mute' },
//     { type: 'flag' },
//     { type: 'pin' },
//     { type: 'quote' },
//     { type: 'mark-as-unread', action: () => {}, component },
//   ],
// } as const;

type MessageAction = {
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

const DefaultActions_UNSTABLE = {
  dropdown: {
    // eslint-disable-next-line react/display-name
    Quote: () => {
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
        <DefaultDropdownActionButton aria-selected='false' onClick={handleQuote} role='option'>
          {t<string>('Quote')}
        </DefaultDropdownActionButton>
      );
    },
    // eslint-disable-next-line react/display-name
    Pin: () => {
      const { handlePin, message } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton aria-selected='false' onClick={handlePin} role='option'>
          {!message.pinned ? t<string>('Pin') : t<string>('Unpin')}
        </DefaultDropdownActionButton>
      );
    },
    // eslint-disable-next-line react/display-name
    MarkAsUnread: () => {
      const { handleMarkUnread } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton aria-selected='false' onClick={handleMarkUnread} role='option'>
          {t<string>('Mark as unread')}
        </DefaultDropdownActionButton>
      );
    },
    // eslint-disable-next-line react/display-name
    Flag: () => {
      const { handleFlag } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton aria-selected='false' onClick={handleFlag} role='option'>
          {t<string>('Flag')}
        </DefaultDropdownActionButton>
      );
    },
    // eslint-disable-next-line react/display-name
    Mute: () => {
      const { handleMute, message } = useMessageContext();
      const { mutes } = useChatContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton aria-selected='false' onClick={handleMute} role='option'>
          {isUserMuted(message, mutes) ? t<string>('Unmute') : t<string>('Mute')}
        </DefaultDropdownActionButton>
      );
    },
    // eslint-disable-next-line react/display-name
    Edit: () => {
      const { handleEdit } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton aria-selected='false' onClick={handleEdit} role='option'>
          {t<string>('Edit Message')}
        </DefaultDropdownActionButton>
      );
    },
    // eslint-disable-next-line react/display-name
    Delete: () => {
      const { handleDelete } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <DefaultDropdownActionButton aria-selected='false' onClick={handleDelete} role='option'>
          {t<string>('Delete')}
        </DefaultDropdownActionButton>
      );
    },
  },
  quick: {
    // eslint-disable-next-line react/display-name
    React: () => {
      const { theme } = useChatContext();

      return <ReactionSelectorWithButton ReactionIcon={DefaultReactionIcon} theme={theme} />;
    },
    // eslint-disable-next-line react/display-name
    Reply: () => {
      const { handleOpenThread } = useMessageContext();
      const { theme } = useChatContext();
      const { t } = useTranslationContext();

      return (
        <button
          aria-label={t('aria/Open Thread')}
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--thread str-chat__message-reply-in-thread-button`}
          data-testid='thread-action'
          onClick={handleOpenThread}
        >
          <ThreadIcon className='str-chat__message-action-icon' />
        </button>
      );
    },
  },
};

export const defaultMessageActionSet_UNSTABLE: MessageAction[] = [
  { Component: DefaultActions_UNSTABLE.quick.Reply, placement: 'quick', type: 'reply' },
  { Component: DefaultActions_UNSTABLE.quick.React, placement: 'quick', type: 'react' },
  //   { placement: 'dropdown', type: 'block' },
  { Component: DefaultActions_UNSTABLE.dropdown.Delete, placement: 'dropdown', type: 'delete' },
  { Component: DefaultActions_UNSTABLE.dropdown.Edit, placement: 'dropdown', type: 'edit' },
  { Component: DefaultActions_UNSTABLE.dropdown.Mute, placement: 'dropdown', type: 'mute' },
  { Component: DefaultActions_UNSTABLE.dropdown.Flag, placement: 'dropdown', type: 'flag' },
  { Component: DefaultActions_UNSTABLE.dropdown.Pin, placement: 'dropdown', type: 'pin' },
  { Component: DefaultActions_UNSTABLE.dropdown.Quote, placement: 'dropdown', type: 'quote' },
  {
    Component: DefaultActions_UNSTABLE.dropdown.MarkAsUnread,
    placement: 'dropdown',
    type: 'markAsUnread',
  },
] as const;

export const DefaultQuickActionButton = ({
  children,
  className = 'str-chat__message-simple__actions__action',
  ...rest
}: ComponentPropsWithoutRef<'button'>) => (
  <button className={className} {...rest}>
    {children}
  </button>
);

export const DefaultDropdownActionButton = ({
  children,
  className = 'str-chat__message-actions-list-item-button',
  ...rest
}: ComponentPropsWithoutRef<'button'>) => (
  <button className={className} {...rest}>
    {children}
  </button>
);

/**
 * Default filter function which covers actions of type `delete`, `edit`,
 * `flag`, `markAsUnread`, `mute`, `quote`, `react` and `reply` and whether
 * the rendered message is a reply (replies are limited to certain actions).
 *
 * @returns boolean
 */
export const defaultFilterFunction: MessageActionFilterFunction = ({
  isMessageThreadReply,
  messageAction: { type },
  userCapabilities,
}) => {
  if (ACTIONS_NOT_WORKING_IN_THREAD.includes(type) && isMessageThreadReply) return false;

  if (type === 'delete' && !userCapabilities.canDelete) return false;
  if (type === 'edit' && !userCapabilities.canEdit) return false;
  if (type === 'flag' && !userCapabilities.canFlag) return false;
  if (type === 'markAsUnread' && !userCapabilities.canMarkUnread) return false;
  if (type === 'mute' && !userCapabilities.canMute) return false;
  if (type === 'quote' && !userCapabilities.canQuote) return false;
  if (type === 'react' && !userCapabilities.canReact) return false;
  if (type === 'reply' && !userCapabilities.canReply) return false;

  return true;
};

export type MessageActionFilterFunction = (value: {
  index: number;
  isMessageThreadReply: boolean;
  messageAction: MessageAction;
  userCapabilities: ReturnType<typeof useUserRole>;
}) => boolean;

const useMessageActionFilter_UNSTABLE = ({
  messageActionSet,
  filterFunction = defaultFilterFunction,
}: {
  messageActionSet: MessageAction[];
  filterFunction?: MessageActionFilterFunction;
}) => {
  const { message } = useMessageContext();

  const isMessageThreadReply = typeof message.parent_id === 'string';

  const userCapabilities = useUserRole(message);

  return useMemo(() => {
    const filteredSet = messageActionSet.filter((messageAction, index) =>
      filterFunction({
        messageAction,
        index,
        userCapabilities,
        isMessageThreadReply,
      }),
    );

    return filteredSet;
  }, [filterFunction, isMessageThreadReply, messageActionSet, userCapabilities]);
};

export const useSplitMessageActionSet_UNSTABLE = (messageActionSet: MessageAction[]) =>
  useMemo(() => {
    const quickActionSet: MessageAction[] = [];
    const dropdownActionSet: MessageAction[] = [];

    for (const action of messageActionSet) {
      if (action.placement === 'quick') quickActionSet.push(action);
      if (action.placement === 'dropdown') dropdownActionSet.push(action);
    }

    return { quickActionSet, dropdownActionSet } as const;
  }, [messageActionSet]);

export const MessageActions_UNSTABLE = ({
  messageActionSet = defaultMessageActionSet_UNSTABLE,
  filterFunction,
}: {
  filterFunction?: MessageActionFilterFunction;
  messageActionSet?: MessageAction[];
}) => {
  const { theme } = useChatContext();
  const { initialMessage, isMyMessage, message } = useMessageContext();
  const { t } = useTranslationContext();
  const [actionsBoxButtonElement, setActionsBoxButtonElement] = useState<HTMLButtonElement | null>(
    null,
  );

  const filteredMessageActionSet = useMessageActionFilter_UNSTABLE({
    messageActionSet,
    filterFunction,
  });
  const { dropdownActionSet, quickActionSet } = useSplitMessageActionSet_UNSTABLE(
    filteredMessageActionSet,
  );

  const dialogId = `message-actions--${message.id}`;
  const dialog = useDialog({ id: dialogId });
  const dropdownDialogIsOpen = useDialogIsOpen(`message-actions--${message.id}`);
  const reactionSelectorDialogIsOpen = useDialogIsOpen(`reaction-selector--${message.id}`);

  // do not render actions
  if (
    !message.type ||
    message.type === 'error' ||
    message.type === 'system' ||
    message.type === 'ephemeral' ||
    message.status === 'failed' ||
    message.status === 'sending' ||
    initialMessage
  ) {
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
            id={dialogId}
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
