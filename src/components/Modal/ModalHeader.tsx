import React from 'react';
import clsx from 'clsx';

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
    {close && <button className='str-chat__modal-header__close-button' onClick={close} />}
  </div>
);
