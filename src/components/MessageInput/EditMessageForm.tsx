import React, { useCallback, useEffect } from 'react';
import { MessageInputFlat } from './MessageInputFlat';

import { useMessageInputContext, useTranslationContext } from '../../context';
import { useMessageComposer, useMessageComposerHasSendableData } from './hooks';

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
