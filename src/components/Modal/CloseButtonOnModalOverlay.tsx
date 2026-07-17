import { Button } from '../Button';
import { useComponentContext } from '../../context';
import { IconXmark as DefaultIconXmark } from '../Icons';
import type { ComponentProps } from 'react';
import clsx from 'clsx';

// todo: remove as unused
export const CloseButtonOnModalOverlay = ({
  children,
  className,
  ...props
}: ComponentProps<'button'>) => {
  const { icons: { IconXmark = DefaultIconXmark } = {} } = useComponentContext();
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
