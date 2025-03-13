import React, { useEffect } from 'react';
import { MessageInputFlat } from './MessageInputFlat';

import { useMessageInputContext, useTranslationContext } from '../../context';

import type { CustomTrigger } from '../../types/types';

export const EditMessageForm = <V extends CustomTrigger = CustomTrigger>() => {
  const { t } = useTranslationContext('EditMessageForm');

  const { clearEditingState, handleSubmit } =
    useMessageInputContext<V>('EditMessageForm');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearEditingState?.();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [clearEditingState]);

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
          onClick={clearEditingState}
        >
          {t<string>('Cancel')}
        </button>
        <button
          className='str-chat__edit-message-send'
          data-testid='send-button-edit-form'
          type='submit'
        >
          {t<string>('Send')}
        </button>
      </div>
    </form>
  );
};
