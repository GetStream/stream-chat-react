import React, { type ComponentProps, type PropsWithChildren } from 'react';
import clsx from 'clsx';
import { Button, type ButtonProps } from '../../Button';
import { IconXmark } from '../../Icons';
import { useModalContext, useTranslationContext } from '../../../context';
import { useAriaIdentifiers } from '../../../a11y/hooks/useAriaIdentifiers';

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
  descriptionId?: string;
  titleId?: string;
};

const PromptHeader = ({
  className,
  close,
  description,
  descriptionId,
  title,
  titleId,
}: PromptHeaderProps) => {
  const { t } = useTranslationContext();
  const { dialogId } = useModalContext();
  const { descriptionId: derivedDescriptionId, titleId: derivedTitleId } =
    useAriaIdentifiers(dialogId);
  const resolvedTitleId = titleId ?? derivedTitleId;
  const resolvedDescriptionId = descriptionId ?? derivedDescriptionId;

  return (
    <div className={clsx('str-chat__prompt__header', className)}>
      <div className='str-chat__prompt__header__title-group'>
        <h2 className='str-chat__prompt__header__title' id={resolvedTitleId}>
          {title}
        </h2>
        {description != null && description !== '' && (
          <p className='str-chat__prompt__header__description' id={resolvedDescriptionId}>
            {description}
          </p>
        )}
      </div>
      {close && (
        <Button
          appearance='ghost'
          aria-describedby={
            description != null && description !== '' ? resolvedDescriptionId : undefined
          }
          aria-label={t('Close prompt: {{ title }}', { title })}
          circular
          className='str-chat__prompt__header__close-button'
          onClick={close}
          size='md'
          variant='secondary'
        >
          <IconXmark />
        </Button>
      )}
    </div>
  );
};

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
    appearance='ghost'
    className={clsx('str-chat__prompt__footer__controls-button', className)}
    size='md'
    variant='secondary'
    {...props}
  />
);

const PromptFooterControlsButtonPrimary = ({ className, ...props }: ButtonProps) => (
  <Button
    appearance='solid'
    className={clsx('str-chat__prompt__footer__controls-button', className)}
    size='md'
    variant='primary'
    {...props}
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
