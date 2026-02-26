import type { PropsWithChildren } from 'react';
import React from 'react';
import { GlobalModal } from '../../Modal';
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
  const { Modal = GlobalModal } = useComponentContext();
  return (
    <>
      <Button
        appearance='outline'
        className={clsx('str-chat__poll-action', {
          'str-chat__poll-action--additional': isAdditionalAction,
        })}
        onClick={openModal}
        size='md'
        variant='secondary'
      >
        {buttonText}
      </Button>
      <Modal className={modalClassName} onClose={closeModal} open={modalIsOpen}>
        {children}
      </Modal>
    </>
  );
};
