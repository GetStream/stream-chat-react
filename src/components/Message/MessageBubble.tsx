import type { ComponentProps } from 'react';
import clsx from 'clsx';

export const MessageBubble = ({ className, ...props }: ComponentProps<'div'>) => (
  <div {...props} className={clsx('str-chat__message-bubble', className)} />
);
