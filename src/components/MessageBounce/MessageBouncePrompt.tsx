import React from 'react';
import { useMessageBounceContext, useTranslationContext } from '../../context';

import type { MouseEventHandler, PropsWithChildren } from 'react';
import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ModalProps } from '../Modal';

export type MessageBouncePromptProps = PropsWithChildren<Pick<ModalProps, 'onClose'>>;

export function MessageBouncePrompt<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({ children, onClose }: MessageBouncePromptProps) {
  const { handleDelete, handleEdit, handleRetry } = useMessageBounceContext<StreamChatGenerics>(
    'MessageBouncePrompt',
  );
  const { t } = useTranslationContext('MessageBouncePrompt');

  function createHandler(
    handle: MouseEventHandler<HTMLButtonElement>,
  ): MouseEventHandler<HTMLButtonElement> {
    return (e) => {
      handle(e);
      onClose?.(e);
    };
  }

  return (
    <div className='str-chat__message-bounce-prompt' data-testid='message-bounce-prompt'>
      <div className='str-chat__message-bounce-prompt-header'>
        {children ?? t<string>('This message did not meet our content guidelines')}
      </div>
      <div className='str-chat__message-bounce-actions'>
        <button
          className='str-chat__message-bounce-edit'
          data-testid='message-bounce-edit'
          onClick={createHandler(handleEdit)}
          type='button'
        >
          {t<string>('Edit Message')}
        </button>
        <button
          className='str-chat__message-bounce-send'
          data-testid='message-bounce-send'
          onClick={createHandler(handleRetry)}
        >
          {t<string>('Send Anyway')}
        </button>
        <button
          className='str-chat__message-bounce-delete'
          data-testid='message-bounce-delete'
          onClick={createHandler(handleDelete)}
        >
          {t<string>('Delete')}
        </button>
      </div>
    </div>
  );
}
