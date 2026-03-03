import clsx from 'clsx';
import React, { type PropsWithChildren } from 'react';

export type MessageActionsWrapperProps = {
  customWrapperClass?: string;
  inline?: boolean;
  toggleOpen?: () => void;
};

export const MessageActionsWrapper = (
  props: PropsWithChildren<MessageActionsWrapperProps>,
) => {
  const { children, customWrapperClass, inline, toggleOpen } = props;

  const defaultWrapperClass = clsx(
    'str-chat__message-simple__actions__action',
    'str-chat__message-simple__actions__action--options',
    'str-chat__message-actions-container',
  );

  const wrapperProps = {
    className: customWrapperClass || defaultWrapperClass,
    'data-testid': 'message-actions',
    onClick: toggleOpen,
  };

  if (inline) return <span {...wrapperProps}>{children}</span>;

  return <div {...wrapperProps}>{children}</div>;
};
