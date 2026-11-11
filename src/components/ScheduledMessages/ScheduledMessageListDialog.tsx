import clsx from 'clsx';
import React, { useRef, useState } from 'react';

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
import { useScheduledMessages } from './hooks';
import type { ScheduledMessageItemProps } from './ScheduledMessageItem';
import { ScheduledMessageList as DefaultScheduledMessageList } from './ScheduledMessageList';

const getChannelContainer = () => document.getElementById(CHANNEL_CONTAINER_ID);

export type ScheduledMessageListDialogProps = Pick<
  ScheduledMessageItemProps,
  'onEdit'
> & {
  /** The channel whose scheduled messages to list. */
  cid: string;
  close: () => void;
  open: boolean;
  /** The thread whose scheduled replies to list. */
  parentId?: string;
};

/**
 * The scheduled messages of a channel or thread in a modal, with a search field. The banner's
 * "View all" opens it; an override can show the list elsewhere, such as in a channel detail view.
 */
export const ScheduledMessageListDialog = ({
  cid,
  close,
  onEdit,
  open,
  parentId,
}: ScheduledMessageListDialogProps) => {
  const { t } = useTranslationContext();
  const { IconSearch, IconXCircle } = useComponentContextIcons();
  const { Modal = GlobalModal, ScheduledMessageList = DefaultScheduledMessageList } =
    useComponentContext();
  const { scheduledMessages } = useScheduledMessages({ cid, parentId });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const closeDialog = () => {
    setSearchQuery('');
    close();
  };

  return (
    <Portal getPortalDestination={getChannelContainer} isOpen={open}>
      <Modal
        className='str-chat__scheduled-message-list-modal'
        onClose={closeDialog}
        open={open}
      >
        {open && (
          <Prompt.Root
            className='str-chat__scheduled-message-list-dialog'
            data-testid='scheduled-message-list-dialog'
          >
            <Prompt.Header
              close={closeDialog}
              title={
                parentId
                  ? t('scheduledMessages.scheduledReplies', 'Scheduled replies')
                  : t('scheduledMessages.scheduledMessages', 'Scheduled messages')
              }
            />
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
                cid={cid}
                onEdit={onEdit}
                parentId={parentId}
                searchQuery={searchQuery}
              />
            </Prompt.Body>
          </Prompt.Root>
        )}
      </Modal>
    </Portal>
  );
};
