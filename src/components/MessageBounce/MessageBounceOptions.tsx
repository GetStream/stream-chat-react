import React, { MouseEventHandler, PropsWithChildren } from 'react';
import { DefaultStreamChatGenerics } from '../../types/types';
import { ModalProps } from '../Modal';
import { useMessageBounceContext, useTranslationContext } from '../../context';

export type MessageBounceOptionsProps = PropsWithChildren<Pick<ModalProps, 'onClose'>>;

export function MessageBounceOptions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({ children, onClose }: MessageBounceOptionsProps) {
  const { handleDelete, handleEdit, handleRetry } = useMessageBounceContext<StreamChatGenerics>(
    'MessageBounceOptions',
  );
  const { t } = useTranslationContext('MessageBounceOptions');

  function createHandler(
    handle: MouseEventHandler<HTMLButtonElement>,
  ): MouseEventHandler<HTMLButtonElement> {
    return (e) => {
      handle(e);
      onClose?.(e);
    };
  }

  return (
    <div className='str-chat__message-bounce-options'>
      <div className='str-chat__message-bounce-options-header'>
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
