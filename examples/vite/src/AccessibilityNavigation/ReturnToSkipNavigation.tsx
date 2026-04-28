import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';

import { CHAT_SKIP_NAVIGATION_TARGET_ID } from './ChatSkipNavigation.tsx';

type ReturnToSkipNavigationProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  targetId?: string;
};
const isActivationKey = (event: React.KeyboardEvent<HTMLAnchorElement>) =>
  event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';

const focusTargetElement = (targetId: string) => {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;

  const firstSkipNavigationLink = targetElement.querySelector<HTMLElement>(
    '.str-chat__skip-navigation-link',
  );
  if (firstSkipNavigationLink) {
    firstSkipNavigationLink.focus();
    return;
  }

  const hasTabIndexAttribute = targetElement.hasAttribute('tabindex');
  if (!hasTabIndexAttribute) {
    targetElement.setAttribute('tabindex', '-1');
  }

  targetElement.focus();

  if (!hasTabIndexAttribute) {
    targetElement.addEventListener(
      'blur',
      () => {
        targetElement.removeAttribute('tabindex');
      },
      { once: true },
    );
  }
};

export const ReturnToSkipNavigation = ({
  children = 'Back to quick navigation',
  className,
  onClick,
  onKeyDown,
  targetId = CHAT_SKIP_NAVIGATION_TARGET_ID,
  ...anchorProps
}: ReturnToSkipNavigationProps) => {
  const handleClick: ComponentPropsWithoutRef<'a'>['onClick'] = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();
    focusTargetElement(targetId);
  };
  const handleKeyDown: ComponentPropsWithoutRef<'a'>['onKeyDown'] = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !isActivationKey(event)) return;

    event.preventDefault();
    focusTargetElement(targetId);
  };

  return (
    <a
      {...anchorProps}
      className={['app-return-to-skip-navigation', className].filter(Boolean).join(' ')}
      href={`#${targetId}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </a>
  );
};
