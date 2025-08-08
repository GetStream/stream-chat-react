import type { ComponentType, PropsWithChildren } from 'react';
import React from 'react';
import type { ModalProps } from '../Modal';
import { Modal as DefaultModal } from '../Modal';
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
  const { Modal = DefaultModal } = useComponentContext();
  return (
    <Modal className='str-chat__message-bounce-modal' {...modalProps}>
      <MessageBounceProvider>
        <MessageBouncePrompt onClose={modalProps.onClose} />
      </MessageBounceProvider>
    </Modal>
  );
}
