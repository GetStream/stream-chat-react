/* eslint-disable sort-keys */
import React from 'react';

import { isUserMuted } from '../../components';
import { ReactionIcon as DefaultReactionIcon, ThreadIcon } from '../../components/Message/icons';
import { ReactionSelectorWithButton } from '../../components/Reactions/ReactionSelectorWithButton';
import {
  useChannelActionContext,
  useChatContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';

import type { ComponentPropsWithoutRef } from 'react';

import type { MessageActionSetItem } from './MessageActions';

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
    MarkUnread() {
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

export const defaultMessageActionSet: MessageActionSetItem[] = [
  // { placement: 'dropdown', type: 'block' },
  { Component: DefaultMessageActionComponents.quick.Reply, placement: 'quick', type: 'reply' },
  { Component: DefaultMessageActionComponents.quick.React, placement: 'quick', type: 'react' },
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
    Component: DefaultMessageActionComponents.dropdown.MarkUnread,
    placement: 'dropdown',
    type: 'markUnread',
  },
] as const;
