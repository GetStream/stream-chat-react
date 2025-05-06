import type { ComponentType, PropsWithChildren } from 'react';
import React from 'react';
import type { ModalProps } from '../Modal';
import { Modal } from '../Modal';
import { MessageBounceProvider } from '../../context';
import type { MessageBouncePromptProps } from './MessageBouncePrompt';

export type MessageBounceModalProps = PropsWithChildren<
  ModalProps & {
    MessageBouncePrompt: ComponentType<MessageBouncePromptProps>;
  }
>;

export function MessageBounceModal({
  MessageBouncePrompt,
  ...modalProps
}: MessageBounceModalProps) {
  return (
    <Modal className='str-chat__message-bounce-modal' {...modalProps}>
      <MessageBounceProvider>
        <MessageBouncePrompt onClose={modalProps.onClose} />
      </MessageBounceProvider>
    </Modal>
  );
}
