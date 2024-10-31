import { nanoid } from 'nanoid';
import React, { ElementRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UploadIcon as DefaultUploadIcon } from './icons';
import { CHANNEL_CONTAINER_ID } from '../Channel/constants';
import { DialogAnchor, useDialog, useDialogIsOpen } from '../Dialog';
import { DialogMenuButton } from '../Dialog/DialogMenu';
import { Modal } from '../Modal';
import { PollCreationDialog } from '../Poll';
import { Portal } from '../Portal/Portal';
import { UploadFileInput } from '../ReactFileUtilities';
import {
  useChannelStateContext,
  useComponentContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import {
  AttachmentSelectorContextProvider,
  useAttachmentSelectorContext,
} from '../../context/AttachmentSelectorContext';
import type { DefaultStreamChatGenerics } from '../../types';

export const SimpleAttachmentSelector = () => {
  const {
    AttachmentSelectorInitiationButtonContents,
    FileUploadIcon = DefaultUploadIcon,
  } = useComponentContext();
  const inputRef = useRef<ElementRef<'input'>>(null);
  const [labelElement, setLabelElement] = useState<HTMLLabelElement | null>(null);
  const id = useMemo(() => nanoid(), []);

  useEffect(() => {
    if (!labelElement) return;
    const handleKeyUp = (event: KeyboardEvent) => {
      if (![' ', 'Enter'].includes(event.key) || !inputRef.current) return;
      event.preventDefault();
      inputRef.current.click();
    };
    labelElement.addEventListener('keyup', handleKeyUp);
    return () => {
      labelElement.removeEventListener('keyup', handleKeyUp);
    };
  }, [labelElement]);

  return (
    <div className='str-chat__file-input-container' data-testid='file-upload-button'>
      <UploadFileInput id={id} ref={inputRef} />
      <label className='str-chat__file-input-label' htmlFor={id} ref={setLabelElement} tabIndex={0}>
        {AttachmentSelectorInitiationButtonContents ? (
          <AttachmentSelectorInitiationButtonContents />
        ) : (
          <FileUploadIcon />
        )}
      </label>
    </div>
  );
};

const AttachmentSelectorMenuInitButtonIcon = () => {
  const { AttachmentSelectorInitiationButtonContents, FileUploadIcon } = useComponentContext(
    'SimpleAttachmentSelector',
  );
  if (AttachmentSelectorInitiationButtonContents) {
    return <AttachmentSelectorInitiationButtonContents />;
  }
  if (FileUploadIcon) {
    return <FileUploadIcon />;
  }
  return <div className='str-chat__attachment-selector__menu-button__icon' />;
};

export type AttachmentSelectorActionProps = {
  closeMenu: () => void;
};

export const DefaultAttachmentSelectorComponents = {
  File({ closeMenu }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    const { fileInput } = useAttachmentSelectorContext();

    return (
      <DialogMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__upload-file-button'
        onClick={() => {
          if (fileInput) fileInput.click();
          closeMenu();
        }}
      >
        {t<string>('File')}
      </DialogMenuButton>
    );
  },
  Poll({ closeMenu }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    const { openPollModal } = useAttachmentSelectorContext();
    return (
      <DialogMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__create-poll-button'
        onClick={() => {
          openPollModal();
          closeMenu();
        }}
      >
        {t<string>('Poll')}
      </DialogMenuButton>
    );
  },
};

export type AttachmentSelectorAction = {
  Component: React.ComponentType<AttachmentSelectorActionProps>;
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: 'uploadFile' | 'createPoll' | (string & {});
};

export const defaultAttachmentSelectorActionSet: AttachmentSelectorAction[] = [
  { Component: DefaultAttachmentSelectorComponents.File, type: 'uploadFile' },
  { Component: DefaultAttachmentSelectorComponents.Poll, type: 'createPoll' },
];

export type AttachmentSelectorProps = {
  attachmentSelectorActionSet?: AttachmentSelectorAction[];
};

const useAttachmentSelectorActionsFiltered = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  original: AttachmentSelectorAction[],
) => {
  const { channelCapabilities, channelConfig } = useChannelStateContext<StreamChatGenerics>();
  const { isThreadInput } = useMessageInputContext();

  return original.filter((action) => {
    if (action.type === 'uploadFile' && !channelCapabilities['upload-file']) return false;
    if (
      action.type === 'createPoll' &&
      (!channelConfig?.polls || isThreadInput || !channelCapabilities['send-poll'])
    )
      return false;
    return true;
  });
};

export const AttachmentSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachmentSelectorActionSet = defaultAttachmentSelectorActionSet,
}: AttachmentSelectorProps) => {
  const { t } = useTranslationContext();
  const { channelCapabilities } = useChannelStateContext<StreamChatGenerics>();
  const { isThreadInput } = useMessageInputContext();

  const actions = useAttachmentSelectorActionsFiltered<StreamChatGenerics>(
    attachmentSelectorActionSet,
  );

  const menuDialogId = `attachment-actions-menu${isThreadInput ? '-thread' : ''}`;
  const menuDialog = useDialog({ id: menuDialogId });
  const menuDialogIsOpen = useDialogIsOpen(menuDialogId);

  const [createPollModalIsOpen, setCreatePollModalIsOpen] = useState<boolean>(false);
  const closePollModal = useCallback(() => setCreatePollModalIsOpen(false), []);
  const openPollModal = useCallback(() => setCreatePollModalIsOpen(true), []);

  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const menuButtonRef = useRef<ElementRef<'button'>>(null);

  const getCreatePollModalDestination = useCallback(
    () => document.getElementById(CHANNEL_CONTAINER_ID),
    [],
  );

  if (actions.length === 0) return null;

  if (actions.length === 1 && actions[0].type === 'uploadFile') return <SimpleAttachmentSelector />;

  return (
    <AttachmentSelectorContextProvider value={{ fileInput, openPollModal }}>
      <div className='str-chat__attachment-selector'>
        {channelCapabilities['upload-file'] && <UploadFileInput ref={setFileInput} />}
        <button
          aria-expanded={menuDialogIsOpen}
          aria-haspopup='true'
          aria-label={t('aria/Open Attachment Selector')}
          className='str-chat__attachment-selector__menu-button'
          data-testid='invoke-attachment-selector-button'
          onClick={() => menuDialog?.toggle()}
          ref={menuButtonRef}
        >
          <AttachmentSelectorMenuInitButtonIcon />
        </button>
        <DialogAnchor
          id={menuDialogId}
          placement='top-start'
          referenceElement={menuButtonRef.current}
          trapFocus
        >
          <div
            className='str-chat__attachment-selector-actions-menu str-chat__dialog-menu'
            data-testid='attachment-selector-actions-menu'
          >
            {actions.map(({ Component, type }) => (
              <Component closeMenu={menuDialog.close} key={`attachment-selector-item-${type}`} />
            ))}
          </div>
        </DialogAnchor>
        <Portal getPortalDestination={getCreatePollModalDestination} isOpen={createPollModalIsOpen}>
          <Modal
            className='str-chat__create-poll-modal'
            onClose={closePollModal}
            open={createPollModalIsOpen}
          >
            <PollCreationDialog close={closePollModal} />
          </Modal>
        </Portal>
      </div>
    </AttachmentSelectorContextProvider>
  );
};
