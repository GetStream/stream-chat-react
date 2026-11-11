import React from 'react';
import clsx from 'clsx';

import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';

export type AITypingIndicatorProps = {
  /** What the agent is doing, such as "Working on your calendar". */
  text: string;
  className?: string;
};

/**
 * A label followed by three pulsing dots, for what the agent is doing while its reply shows
 * nothing new. The counterpart of `AITypingIndicatorView`.
 */
export const AITypingIndicator = ({ className, text }: AITypingIndicatorProps) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  return (
    <ThemeScopeProvider>
      <div
        aria-live='polite'
        className={clsx(themeScopeClassName, 'str-chat__ai-typing-indicator', className)}
        role='status'
      >
        <span className='str-chat__ai-typing-indicator__text'>{text}</span>
        <span aria-hidden className='str-chat__ai-typing-indicator__dots'>
          <span className='str-chat__ai-typing-indicator__dot' />
          <span className='str-chat__ai-typing-indicator__dot' />
          <span className='str-chat__ai-typing-indicator__dot' />
        </span>
      </div>
    </ThemeScopeProvider>
  );
};
