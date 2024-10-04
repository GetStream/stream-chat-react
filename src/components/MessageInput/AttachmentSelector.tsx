import { nanoid } from 'nanoid';
import React, { ElementRef, useEffect, useMemo, useRef, useState } from 'react';
import { UploadIcon as DefaultUploadIcon } from './icons';
import { UploadFileInput } from '../ReactFileUtilities';
import { DialogAnchor, useDialog, useDialogIsOpen } from '../Dialog';
import { DialogMenuButton } from '../Dialog/DialogMenu';
import { useChannelStateContext, useComponentContext, useTranslationContext } from '../../context';
import type { DefaultStreamChatGenerics } from '../../types';

export const SimpleAttachmentSelector = () => {
  const { FileUploadIcon = DefaultUploadIcon } = useComponentContext('SimpleAttachmentSelector');
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
      <UploadFileInput ref={inputRef} />
      <label className='str-chat__file-input-label' htmlFor={id} ref={setLabelElement} tabIndex={0}>
        <FileUploadIcon />
      </label>
    </div>
  );
};

export const AttachmentSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { t } = useTranslationContext('AttachmentSelectorActionsMenu');
  const { channelCapabilities } = useChannelStateContext<StreamChatGenerics>();
  const [input, setInput] = useState<HTMLInputElement | null>(null);

  const menuButtonRef = useRef<ElementRef<'button'>>(null);

  const dialogId = 'attachment-actions-menu';
  const dialog = useDialog({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId);

  if (!channelCapabilities['send-poll'] && !channelCapabilities['upload-file']) return null;

  return (
    <div className='str-chat__attachment-selector'>
      <UploadFileInput ref={setInput} />
      <button
        aria-expanded={dialogIsOpen}
        aria-haspopup='true'
        aria-label={t('aria/Open Attachment Selector')}
        className='str-chat__attachment-selector__menu-button'
        onClick={() => dialog?.toggle()}
        ref={menuButtonRef}
      >
        <div className='str-chat__attachment-selector__menu-button__icon' />
      </button>
      <DialogAnchor
        id={dialogId}
        placement='top-end'
        referenceElement={menuButtonRef.current}
        trapFocus
      >
        <div className='str-chat__attachment-selector-actions-menu str-chat__dialog-menu'>
          {channelCapabilities['upload-file'] && (
            <DialogMenuButton
              className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__upload-file-button'
              onClick={() => {
                input?.click();
                dialog.close();
              }}
            >
              {t<string>('File')}
            </DialogMenuButton>
          )}
          {channelCapabilities['send-poll'] && (
            <DialogMenuButton
              className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__create-poll-button'
              onClick={() => {
                dialog.close();
              }}
            >
              {t<string>('Poll')}
            </DialogMenuButton>
          )}
        </div>
      </DialogAnchor>
    </div>
  );
};
