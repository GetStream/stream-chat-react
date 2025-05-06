import React, { useCallback, useEffect } from 'react';
import { MessageInput } from './MessageInput';
import { MessageInputFlat } from './MessageInputFlat';
import { Modal } from '../Modal';
import {
  useComponentContext,
  useMessageContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import { useMessageComposer, useMessageComposerHasSendableData } from './hooks';

import type { MessageUIComponentProps } from '../Message';

const EditMessageFormSendButton = () => {
  const { t } = useTranslationContext();
  const hasSendableData = useMessageComposerHasSendableData();
  return (
    <button
      className='str-chat__edit-message-send'
      data-testid='send-button-edit-form'
      disabled={!hasSendableData}
      type='submit'
    >
      {t<string>('Send')}
    </button>
  );
};

export const EditMessageForm = () => {
  const { t } = useTranslationContext('EditMessageForm');
  const messageComposer = useMessageComposer();
  const { clearEditingState, handleSubmit } = useMessageInputContext('EditMessageForm');

  const cancel = useCallback(() => {
    clearEditingState?.();
    messageComposer.restore();
  }, [clearEditingState, messageComposer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [cancel]);

  return (
    <form
      autoComplete='off'
      className='str-chat__edit-message-form'
      onSubmit={handleSubmit}
    >
      <MessageInputFlat />
      <div className='str-chat__edit-message-form-options'>
        <button
          className='str-chat__edit-message-cancel'
          data-testid='cancel-button'
          onClick={cancel}
        >
          {t<string>('Cancel')}
        </button>
        <EditMessageFormSendButton />
      </div>
    </form>
  );
};

export const EditMessageModal = ({
  additionalMessageInputProps,
}: Pick<MessageUIComponentProps, 'additionalMessageInputProps'>) => {
  const { EditMessageInput = EditMessageForm } = useComponentContext();
  const { clearEditingState } = useMessageContext();
  const messageComposer = useMessageComposer();
  const onEditModalClose = useCallback(() => {
    clearEditingState();
    messageComposer.restore();
  }, [clearEditingState, messageComposer]);

  return (
    <Modal
      className='str-chat__edit-message-modal'
      onClose={onEditModalClose}
      open={true}
    >
      <MessageInput
        clearEditingState={clearEditingState}
        hideSendButton
        Input={EditMessageInput}
        {...additionalMessageInputProps}
      />
    </Modal>
  );
};
