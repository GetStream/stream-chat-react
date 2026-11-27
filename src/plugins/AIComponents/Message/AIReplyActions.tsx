import React, { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { useAriaLiveAnnouncer } from '../../../components/Accessibility/useAriaLiveAnnouncer';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { useAIIcons } from '../useAIIcons';
import { type AIBranchSwitch, AIBranchSwitcher } from './AIBranchSwitcher';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';

/** How the person rated a reply. */
export type AIMessageRating = 'positive' | 'negative';

export type AIReplyActionsProps = {
  /** The reply's text, which copying and sharing hand on. */
  text: string;
  /**
   * Which of the reply's versions shows, when it was written again: a ‹ i/n › switcher with
   * arrows to the others, shown only while `count` is 2 or more.
   */
  branch?: AIBranchSwitch;
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

const TOOLBAR_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

/**
 * Moves focus between a toolbar's buttons with the arrow keys, Home and End, as the ARIA toolbar
 * pattern asks, the arrows following the reading direction.
 */
export const moveToolbarFocus = (event: KeyboardEvent<HTMLElement>) => {
  if (!TOOLBAR_KEYS.includes(event.key)) return;
  const buttons = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
  );
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (index === -1 || buttons.length < 2) return;
  const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
  const step = (event.key === 'ArrowRight') !== rtl ? 1 : -1;
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : (index + step + buttons.length) % buttons.length;
  event.preventDefault();
  buttons[next].focus();
};

/**
 * The actions under a finished reply: the switcher between its versions when it has several,
 * copy, share (the system share sheet where the browser
 * has one, else a copy), regenerate, and a thumbs up or down rating. The counterpart of
 * `AIReplyActionsView`.
 */
export const AIReplyActions = ({
  branch,
  className,
  onRate,
  onRegenerate,
  rating,
  text,
}: AIReplyActionsProps) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  const { IconCheckmark, IconCopy, IconRefresh } = useComponentContextIcons();
  const {
    IconAIShare,
    IconAIThumbsDown,
    IconAIThumbsDownFill,
    IconAIThumbsUp,
    IconAIThumbsUpFill,
  } = useAIIcons();
  const announce = useAriaLiveAnnouncer();
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    copyText(text).then(
      () => {
        // The button's new name isn't read out on its own, so say it.
        announce(
          t('aiComponents.replyActions.copied.announcement', 'Copied to the clipboard'),
          { dedupeMs: 1000 },
        );
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
        aria-label={t(
          'aiComponents.replyActions.replyActions.ariaLabel',
          'Reply actions',
        )}
        className={clsx(themeScopeClassName, 'str-chat__ai-reply-actions', className)}
        onKeyDown={moveToolbarFocus}
        role='toolbar'
      >
        {branch && <AIBranchSwitcher {...branch} />}
        <button
          aria-label={
            isCopied
              ? t('aiComponents.replyActions.copied.ariaLabel', 'Copied')
              : t('aiComponents.replyActions.copy.ariaLabel', 'Copy')
          }
          className='str-chat__ai-reply-actions__button'
          onClick={copy}
          title={
            isCopied
              ? t('aiComponents.replyActions.copied.ariaLabel', 'Copied')
              : t('aiComponents.replyActions.copy.ariaLabel', 'Copy')
          }
          type='button'
        >
          {isCopied ? <IconCheckmark /> : <IconCopy />}
        </button>
        <button
          aria-label={t('aiComponents.replyActions.share.ariaLabel', 'Share')}
          className='str-chat__ai-reply-actions__button'
          onClick={share}
          title={t('aiComponents.replyActions.share.ariaLabel', 'Share')}
          type='button'
        >
          <IconAIShare />
        </button>
        {onRegenerate && (
          <button
            aria-label={t('aiComponents.replyActions.regenerate.ariaLabel', 'Regenerate')}
            className='str-chat__ai-reply-actions__button'
            onClick={onRegenerate}
            title={t('aiComponents.replyActions.regenerate.ariaLabel', 'Regenerate')}
            type='button'
          >
            <IconRefresh />
          </button>
        )}
        {onRate && (
          <>
            <button
              aria-label={t(
                'aiComponents.replyActions.goodResponse.ariaLabel',
                'Good response',
              )}
              aria-pressed={positive}
              className='str-chat__ai-reply-actions__button'
              onClick={() => onRate(positive ? null : 'positive')}
              title={t(
                'aiComponents.replyActions.goodResponse.ariaLabel',
                'Good response',
              )}
              type='button'
            >
              {positive ? <IconAIThumbsUpFill /> : <IconAIThumbsUp />}
            </button>
            <button
              aria-label={t(
                'aiComponents.replyActions.badResponse.ariaLabel',
                'Bad response',
              )}
              aria-pressed={negative}
              className='str-chat__ai-reply-actions__button'
              onClick={() => onRate(negative ? null : 'negative')}
              title={t('aiComponents.replyActions.badResponse.ariaLabel', 'Bad response')}
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
