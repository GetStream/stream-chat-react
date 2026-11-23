import React from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';

export type AISuggestionsProps = {
  /** Called with the suggestion the person picked, such as to send it. */
  onSelect: (suggestion: string) => void;
  /** Starters for a conversation, such as "What's on my calendar today?". */
  suggestions: string[];
  className?: string;
};

/**
 * A row of starter chips for an empty conversation. Picking one hands its text to
 * `onSelect`. The counterpart of `SuggestionsView`.
 */
export const AISuggestions = ({
  className,
  onSelect,
  suggestions,
}: AISuggestionsProps) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  if (suggestions.length === 0) return null;
  return (
    <ThemeScopeProvider>
      <div
        aria-label={t('aiComponents.suggestions.suggestions.ariaLabel', 'Suggestions')}
        className={clsx(themeScopeClassName, 'str-chat__ai-suggestions', className)}
        role='group'
      >
        {suggestions.map((suggestion) => (
          <button
            className='str-chat__ai-suggestions__item'
            key={suggestion}
            onClick={() => onSelect(suggestion)}
            type='button'
          >
            {suggestion}
          </button>
        ))}
      </div>
    </ThemeScopeProvider>
  );
};
