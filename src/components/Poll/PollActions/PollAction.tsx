import type { PropsWithChildren } from 'react';
import React from 'react';
import { Modal } from '../../Modal';

export type PollActionProps = {
  buttonText: string;
  closeModal: () => void;
  modalIsOpen: boolean;
  openModal: () => void;
  modalClassName?: string;
};

export const PollAction = ({
  buttonText,
  children,
  closeModal,
  modalClassName,
  modalIsOpen,
  openModal,
}: PropsWithChildren<PollActionProps>) => (
  <>
    <button className='str-chat__poll-action' onClick={openModal}>
      {buttonText}
    </button>
    <Modal className={modalClassName} onClose={closeModal} open={modalIsOpen}>
      {children}
    </Modal>
  </>
);
