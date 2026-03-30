import React, { type ComponentProps, type PropsWithChildren } from 'react';
import clsx from 'clsx';
import { Button, type ButtonProps } from '../../Button';
import { IconArrowLeft, IconXmark } from '../../Icons';

const ViewerRoot = ({ children, className, ...props }: ComponentProps<'div'>) => (
  <div {...props} className={clsx('str-chat__viewer', className)}>
    {children}
  </div>
);

export type ViewerHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  close?: () => void;
  goBack?: () => void;
};

const ViewerHeader = ({
  className,
  close,
  description,
  goBack,
  title,
}: ViewerHeaderProps) => (
  <div className={clsx('str-chat__viewer__header', className)}>
    {goBack && (
      <Button
        appearance='ghost'
        circular
        className='str-chat__viewer__header__go-back-button'
        onClick={goBack}
        size='sm'
        variant='secondary'
      >
        <IconArrowLeft />
      </Button>
    )}
    <div className='str-chat__viewer__header__title-group'>
      <div className='str-chat__viewer__header__title'>{title}</div>
      {description != null && description !== '' && (
        <div className='str-chat__viewer__header__description'>{description}</div>
      )}
    </div>
    {close && (
      <Button
        appearance='ghost'
        circular
        className='str-chat__viewer__header__close-button'
        onClick={close}
        size='sm'
        variant='secondary'
      >
        <IconXmark />
      </Button>
    )}
  </div>
);

export type ViewerBodyProps = PropsWithChildren<{
  className?: string;
}>;

const ViewerBody = ({ children, className }: ViewerBodyProps) => (
  <div className={clsx('str-chat__viewer__body', className)}>{children}</div>
);

export type ViewerFooterProps = PropsWithChildren<{
  className?: string;
}>;

const ViewerFooter = ({ children, className }: ViewerFooterProps) => (
  <div className={clsx('str-chat__viewer__footer', className)}>{children}</div>
);

type ViewerFooterControlsProps = PropsWithChildren<{
  className?: string;
}>;

const ViewerFooterControls = ({ children, className }: ViewerFooterControlsProps) => (
  <div className={clsx('str-chat__viewer__footer__controls', className)}>{children}</div>
);

const ViewerFooterControlsButtonSecondary = ({ className, ...props }: ButtonProps) => (
  <Button
    appearance='ghost'
    className={clsx('str-chat__viewer__footer__controls-button', className)}
    size='md'
    variant='secondary'
    {...props}
  />
);

const ViewerFooterControlsButtonPrimary = ({ className, ...props }: ButtonProps) => (
  <Button
    appearance='solid'
    className={clsx('str-chat__viewer__footer__controls-button', className)}
    size='md'
    variant='primary'
    {...props}
  />
);

export const Viewer = {
  Body: ViewerBody,
  Footer: ViewerFooter,
  FooterControls: ViewerFooterControls,
  FooterControlsButtonPrimary: ViewerFooterControlsButtonPrimary,
  FooterControlsButtonSecondary: ViewerFooterControlsButtonSecondary,
  Header: ViewerHeader,
  Root: ViewerRoot,
};
