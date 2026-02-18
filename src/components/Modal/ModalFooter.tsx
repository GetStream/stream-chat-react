import React, { type PropsWithChildren } from 'react';
import clsx from 'clsx';

export type ModalFooterProps = PropsWithChildren<{
  className?: string;
}>;

export const ModalFooter = ({ children, className }: ModalFooterProps) => (
  <div className={clsx('str-chat__modal-footer', className)}>{children}</div>
);
