import React from 'react';
import clsx from 'clsx';

export type ModalHeaderProps = {
  title: string;
  className?: string;
  close?: () => void;
  goBack?: () => void;
};

export const ModalHeader = ({ className, close, goBack, title }: ModalHeaderProps) => (
  <div className={clsx('str-chat__poll-modal__header', className)}>
    {goBack && <button className='str-chat__poll-modal__go-back-button' onClick={goBack} />}
    <div className='str-chat__poll-modal__title'>{title}</div>
    {close && <button className='str-chat__poll-modal__close-button' onClick={close} />}
  </div>
);
