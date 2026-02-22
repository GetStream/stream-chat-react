import React, { type ComponentProps, type PropsWithChildren } from 'react';
import clsx from 'clsx';
import { Button, type ButtonProps } from '../../Button';
import { IconArrowLeft, IconCrossMedium } from '../../Icons';

const PromptRoot = ({ children, className, ...props }: ComponentProps<'div'>) => (
  <div {...props} className={clsx('str-chat__prompt', className)}>
    {children}
  </div>
);

export type PromptHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  close?: () => void;
  goBack?: () => void;
};

const PromptHeader = ({
  className,
  close,
  description,
  goBack,
  title,
}: PromptHeaderProps) => (
  <div className={clsx('str-chat__prompt__header', className)}>
    {goBack && (
      <Button
        className={clsx(
          'str-chat__prompt__header__go-back-button',
          'str-chat__button--secondary',
          'str-chat__button--ghost',
          'str-chat__button--circular',
          'str-chat__button--size-sm',
        )}
        onClick={goBack}
      >
        <IconArrowLeft />
      </Button>
    )}
    <div className='str-chat__prompt__header__title-group'>
      <div className='str-chat__prompt__header__title'>{title}</div>
      {description != null && description !== '' && (
        <div className='str-chat__prompt__header__description'>{description}</div>
      )}
    </div>
    {close && (
      <Button
        className={clsx(
          'str-chat__prompt__header__close-button',
          'str-chat__button--secondary',
          'str-chat__button--ghost',
          'str-chat__button--size-sm',
          'str-chat__button--circular',
        )}
        onClick={close}
      >
        <IconCrossMedium />
      </Button>
    )}
  </div>
);

export type PromptBodyProps = PropsWithChildren<{
  className?: string;
}>;

const PromptBody = ({ children, className }: PromptBodyProps) => (
  <div className={clsx('str-chat__prompt__body', className)}>{children}</div>
);

export type PromptFooterProps = PropsWithChildren<{
  className?: string;
}>;

const PromptFooter = ({ children, className }: PromptFooterProps) => (
  <div className={clsx('str-chat__prompt__footer', className)}>{children}</div>
);

type PromptFooterControlsProps = PropsWithChildren<{
  className?: string;
}>;

const PromptFooterControls = ({ children, className }: PromptFooterControlsProps) => (
  <div className={clsx('str-chat__prompt__footer__controls', className)}>{children}</div>
);

const PromptFooterControlsButtonSecondary = ({ className, ...props }: ButtonProps) => (
  <Button
    {...props}
    className={clsx(
      'str-chat__prompt__footer__controls-button',
      'str-chat__button--secondary',
      'str-chat__button--ghost',
      'str-chat__button--size-md',
      className,
    )}
  />
);

const PromptFooterControlsButtonPrimary = ({ className, ...props }: ButtonProps) => (
  <Button
    {...props}
    className={clsx(
      'str-chat__prompt__footer__controls-button',
      'str-chat__button--primary',
      'str-chat__button--solid',
      'str-chat__button--size-md',
      className,
    )}
  />
);

export const Prompt = {
  Body: PromptBody,
  Footer: PromptFooter,
  FooterControls: PromptFooterControls,
  FooterControlsButtonPrimary: PromptFooterControlsButtonPrimary,
  FooterControlsButtonSecondary: PromptFooterControlsButtonSecondary,
  Header: PromptHeader,
  Root: PromptRoot,
};
