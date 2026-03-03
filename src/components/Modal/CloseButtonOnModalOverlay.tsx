import { Button } from '../Button';
import { IconCrossMedium } from '../Icons';
import type { ComponentProps } from 'react';
import clsx from 'clsx';

export const CloseButtonOnModalOverlay = ({
  children,
  className,
  ...props
}: ComponentProps<'button'>) => (
  <Button
    appearance='ghost'
    circular
    className={clsx('str-chat__modal__overlay__close-button', className)}
    {...props}
  >
    {children ?? <IconCrossMedium />}
  </Button>
);
