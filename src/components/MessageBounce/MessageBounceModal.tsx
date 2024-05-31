import React, { ComponentType, PropsWithChildren } from 'react';
import { Modal, ModalProps } from '../Modal';
import { MessageBounceProvider } from '../../context';
import { MessageBouncePromptProps } from './MessageBouncePrompt';

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
