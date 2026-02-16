import { Button } from '../Button';
import { IconCross } from '../Icons';
import type { ComponentProps } from 'react';
import clsx from 'clsx';

export const CloseButtonOnModalOverlay = ({
  children,
  className,
  ...props
}: ComponentProps<'button'>) => (
  <Button
    {...props}
    className={clsx(
      'str-chat__modal__overlay__close-button',
      'str-chat__button--circular',
      'str-chat__button--ghost',
      className,
    )}
  >
    {children ?? <IconCross />}
  </Button>
);
