import type { ComponentType, PropsWithChildren } from 'react';
import React from 'react';
import { GlobalModal, type ModalProps } from '../Modal';
import { MessageBounceProvider, useComponentContext } from '../../context';
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
  const { Modal = GlobalModal } = useComponentContext();
  return (
    <Modal className='str-chat__message-bounce-modal' {...modalProps}>
      <MessageBounceProvider>
        <MessageBouncePrompt onClose={modalProps.onClose} />
      </MessageBounceProvider>
    </Modal>
  );
}
