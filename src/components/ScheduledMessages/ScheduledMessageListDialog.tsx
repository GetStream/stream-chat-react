import clsx from 'clsx';
import React, { useRef } from 'react';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import { CHANNEL_CONTAINER_ID } from '../Channel/constants';
import { Prompt } from '../Dialog';
import { TextInput } from '../Form';
import { GlobalModal } from '../Modal';
import { Portal } from '../Portal/Portal';
import { useChannelScheduledMessages, useScheduledMessagesSearch } from './hooks';
import type { ScheduledMessagesView } from 'stream-chat';
import type { ScheduledMessageItemProps } from './ScheduledMessageItem';
import { ScheduledMessageList as DefaultScheduledMessageList } from './ScheduledMessageList';

const getChannelContainer = () => document.getElementById(CHANNEL_CONTAINER_ID);

export type ScheduledMessageListDialogProps = Pick<
  ScheduledMessageItemProps,
  'openInComposer'
> & {
  close: () => void;
  open: boolean;
  /** What to list: `channel.scheduledMessages` or `thread.scheduledMessages`. */
  scheduledMessages: ScheduledMessagesView;
};

/** The dialog's content, mounted only while it is open: the search starts empty each time. */
const ScheduledMessageListDialogBody = ({
  openInComposer,
  scheduledMessages: view,
}: Pick<ScheduledMessageListDialogProps, 'openInComposer' | 'scheduledMessages'>) => {
  const { t } = useTranslationContext();
  const { IconSearch, IconXCircle } = useComponentContextIcons();
  const { ScheduledMessageList = DefaultScheduledMessageList } = useComponentContext();
  const { scheduledMessages } = useChannelScheduledMessages(view);
  const { filter, searchQuery, setSearchQuery } = useScheduledMessagesSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <Prompt.Body className='str-chat__scheduled-message-list-dialog__body'>
      {scheduledMessages.length > 0 && (
        <TextInput
          aria-label={t('scheduledMessages.search', 'Search')}
          autoComplete='off'
          className='str-chat__scheduled-message-list-dialog__search'
          leading={<IconSearch />}
          onChange={({ target }) => setSearchQuery(target.value)}
          placeholder={t('scheduledMessages.search', 'Search')}
          ref={searchInputRef}
          trailing={
            <Button
              appearance='ghost'
              aria-label={t('search.bar.clearSearch.ariaLabel', 'Clear search')}
              circular
              className={clsx(
                'str-chat__scheduled-message-list-dialog__clear-search',
                'str-chat__form-text-input__clear-button',
                !searchQuery && 'str-chat__form-text-input__clear-button--hidden',
              )}
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              size='xs'
              variant='secondary'
            >
              <IconXCircle />
            </Button>
          }
          type='search'
          value={searchQuery}
        />
      )}
      <ScheduledMessageList
        filter={filter}
        openInComposer={openInComposer}
        scheduledMessages={view}
      />
    </Prompt.Body>
  );
};

/**
 * The scheduled messages of a channel or thread in a modal, with a search field. The banner's
 * "View all" opens it; an override can show the list elsewhere, such as in a channel detail view,
 * or search differently with `useScheduledMessagesSearch`'s `filter`.
 */
export const ScheduledMessageListDialog = ({
  close,
  open,
  openInComposer,
  scheduledMessages,
}: ScheduledMessageListDialogProps) => {
  const { t } = useTranslationContext();
  const { Modal = GlobalModal } = useComponentContext();

  return (
    <Portal getPortalDestination={getChannelContainer} isOpen={open}>
      <Modal
        className='str-chat__scheduled-message-list-modal'
        onClose={close}
        open={open}
      >
        {open && (
          <Prompt.Root
            className='str-chat__scheduled-message-list-dialog'
            data-testid='scheduled-message-list-dialog'
          >
            <Prompt.Header
              close={close}
              title={
                scheduledMessages.parentId
                  ? t('scheduledMessages.scheduledReplies', 'Scheduled replies')
                  : t('scheduledMessages.scheduledMessages', 'Scheduled messages')
              }
            />
            <ScheduledMessageListDialogBody
              openInComposer={openInComposer}
              scheduledMessages={scheduledMessages}
            />
          </Prompt.Root>
        )}
      </Modal>
    </Portal>
  );
};
