import React from 'react';
import clsx from 'clsx';
import { Button } from '../Button';
import { IconCross } from '../Icons';

export type ModalHeaderProps = {
  title: string;
  className?: string;
  close?: () => void;
  goBack?: () => void;
};

export const ModalHeader = ({ className, close, goBack, title }: ModalHeaderProps) => (
  <div className={clsx('str-chat__modal-header', className)}>
    {goBack && (
      <button className='str-chat__modal-header__go-back-button' onClick={goBack} />
    )}
    <div className='str-chat__modal-header__title'>{title}</div>
    {close && (
      <Button
        className={clsx(
          'str-chat__modal-header__close-button',
          'str-chat__button--secondary',
          'str-chat__button--ghost',
          'str-chat__button--size-sm',
          'str-chat__button--circular',
        )}
        onClick={close}
      >
        <IconCross />
      </Button>
    )}
  </div>
);
