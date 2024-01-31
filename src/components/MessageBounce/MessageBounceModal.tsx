import React, { ComponentType, PropsWithChildren } from 'react';
import { Modal, ModalProps } from '../Modal';
import { MessageBounceProvider } from '../../context';
import { MessageBounceOptionsProps } from './MessageBounceOptions';

export type MessageBounceModalProps = PropsWithChildren<
  ModalProps & {
    MessageBounceOptions: ComponentType<MessageBounceOptionsProps>;
  }
>;

export function MessageBounceModal({
  MessageBounceOptions,
  ...modalProps
}: MessageBounceModalProps) {
  return (
    <Modal {...modalProps}>
      <MessageBounceProvider>
        <MessageBounceOptions onClose={modalProps.onClose} />
      </MessageBounceProvider>
    </Modal>
  );
}
