import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';

export const Anchor = ({ children, href }: ComponentProps<'a'>) => {
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
