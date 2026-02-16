import type { PropsWithChildren } from 'react';
import React from 'react';
import { Modal as DefaultModal } from '../../Modal';
import { useComponentContext } from '../../../context';
import { Button } from '../../Button';
import clsx from 'clsx';

export type PollActionProps = {
  buttonText: string;
  closeModal: () => void;
  modalIsOpen: boolean;
  openModal: () => void;
  /**
   * Additional actions are shown based on the poll settings defined by the creator.
   * Examples are "Suggest an option", "Add a comment", "View N comment(s)".
   */
  isAdditionalAction?: boolean;
  modalClassName?: string;
};

export const PollAction = ({
  buttonText,
  children,
  closeModal,
  isAdditionalAction,
  modalClassName,
  modalIsOpen,
  openModal,
}: PropsWithChildren<PollActionProps>) => {
  const { Modal = DefaultModal } = useComponentContext();
  return (
    <>
      <Button
        className={clsx(
          'str-chat__poll-action',
          'str-chat__button--outline',
          'str-chat__button--secondary',
          'str-chat__button--size-md',
          { 'str-chat__poll-action--additional': isAdditionalAction },
        )}
        onClick={openModal}
      >
        {buttonText}
      </Button>
      <Modal className={modalClassName} onClose={closeModal} open={modalIsOpen}>
        {children}
      </Modal>
    </>
  );
};
