import clsx from 'clsx';
import React, { ComponentProps } from 'react';
import { ReactMarkdownProps } from 'react-markdown/lib/complex-types';

export const Anchor = ({ children, href }: ComponentProps<'a'> & ReactMarkdownProps) => {
  const isEmail = href?.startsWith('mailto:');
  const isUrl = href?.startsWith('http');

  if (!href || (!isEmail && !isUrl)) return <>{children}</>;

  return (
    <a
      className={clsx({ 'str-chat__message-url-link': isUrl })}
      href={href}
      rel='nofollow noreferrer noopener'
      target='_blank'
    >
      {children}
    </a>
  );
};
