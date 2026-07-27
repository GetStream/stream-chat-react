import { Button } from '../Button';
import { useComponentContextIcons } from '../../context';
import type { ComponentProps } from 'react';
import clsx from 'clsx';

// todo: remove as unused
export const CloseButtonOnModalOverlay = ({
  children,
  className,
  ...props
}: ComponentProps<'button'>) => {
  const { IconXmark } = useComponentContextIcons();
  return (
    <Button
      appearance='ghost'
      circular
      className={clsx('str-chat__modal__overlay__close-button', className)}
      {...props}
    >
      {children ?? <IconXmark />}
    </Button>
  );
};
