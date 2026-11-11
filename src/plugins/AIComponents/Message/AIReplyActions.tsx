import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import {
  IconAIShare,
  IconAIThumbsDown,
  IconAIThumbsDownFill,
  IconAIThumbsUp,
  IconAIThumbsUpFill,
} from '../icons';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';

/** How the person rated a reply. */
export type AIMessageRating = 'positive' | 'negative';

export type AIReplyActionsProps = {
  /** The reply's text, which copying and sharing hand on. */
  text: string;
  className?: string;
  /** Rates the reply, or takes the rating back with `null`. Without it, no rating is offered. */
  onRate?: (rating: AIMessageRating | null) => void;
  /** Asks the agent for a new reply in its place. Without it, no regenerate button. */
  onRegenerate?: () => void;
  /** How the person rated the reply, if they did. */
  rating?: AIMessageRating | null;
};

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Clipboard API unavailable (insecure context): fall back to a selection copy.
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
};

/**
 * The actions under a finished reply: copy, share (the system share sheet where the browser
 * has one, else a copy), regenerate, and a thumbs up or down rating. The counterpart of
 * `AIReplyActionsView`.
 */
export const AIReplyActions = ({
  className,
  onRate,
  onRegenerate,
  rating,
  text,
}: AIReplyActionsProps) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  const { IconCheckmark, IconCopy, IconRefresh } = useComponentContextIcons();
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    copyText(text).then(
      () => {
        setIsCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setIsCopied(false), 1500);
      },
      () => undefined,
    );
  };

  const share = () => {
    if (typeof navigator.share === 'function') {
      navigator.share({ text }).catch((error: unknown) => {
        // The person closing the share sheet is not a failure.
        if (error instanceof Error && error.name === 'AbortError') return;
        copy();
      });
      return;
    }
    copy();
  };

  const positive = rating === 'positive';
  const negative = rating === 'negative';

  return (
    <ThemeScopeProvider>
      <div
        aria-label={t('aria/Reply actions')}
        className={clsx(themeScopeClassName, 'str-chat__ai-reply-actions', className)}
        role='toolbar'
      >
        <button
          aria-label={isCopied ? t('aria/Copied') : t('aria/Copy')}
          className='str-chat__ai-reply-actions__button'
          onClick={copy}
          title={isCopied ? t('aria/Copied') : t('aria/Copy')}
          type='button'
        >
          {isCopied ? <IconCheckmark /> : <IconCopy />}
        </button>
        <button
          aria-label={t('aria/Share')}
          className='str-chat__ai-reply-actions__button'
          onClick={share}
          title={t('aria/Share')}
          type='button'
        >
          <IconAIShare />
        </button>
        {onRegenerate && (
          <button
            aria-label={t('aria/Regenerate')}
            className='str-chat__ai-reply-actions__button'
            onClick={onRegenerate}
            title={t('aria/Regenerate')}
            type='button'
          >
            <IconRefresh />
          </button>
        )}
        {onRate && (
          <>
            <button
              aria-label={t('aria/Good response')}
              aria-pressed={positive}
              className='str-chat__ai-reply-actions__button'
              onClick={() => onRate(positive ? null : 'positive')}
              title={t('aria/Good response')}
              type='button'
            >
              {positive ? <IconAIThumbsUpFill /> : <IconAIThumbsUp />}
            </button>
            <button
              aria-label={t('aria/Bad response')}
              aria-pressed={negative}
              className='str-chat__ai-reply-actions__button'
              onClick={() => onRate(negative ? null : 'negative')}
              title={t('aria/Bad response')}
              type='button'
            >
              {negative ? <IconAIThumbsDownFill /> : <IconAIThumbsDown />}
            </button>
          </>
        )}
      </div>
    </ThemeScopeProvider>
  );
};
