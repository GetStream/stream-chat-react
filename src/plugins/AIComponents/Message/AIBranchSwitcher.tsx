import React from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import type { AIBranchSwitch } from '../Conversation/controller/types';

export type { AIBranchSwitch };

export type AIBranchSwitcherProps = AIBranchSwitch & { className?: string };

/**
 * ‹ i/n ›: which version of a message shows, with arrows to the previous and the next one. Each
 * arrow is disabled at its end. Renders nothing while there is one version.
 */
export const AIBranchSwitcher = ({
  className,
  count,
  index,
  onNext,
  onPrevious,
}: AIBranchSwitcherProps) => {
  const { t } = useTranslationContext();
  const { IconChevronLeft, IconChevronRight } = useComponentContextIcons();
  if (!(count > 1)) return null;
  const hasPrevious = !!onPrevious && index > 1;
  const hasNext = !!onNext && index < count;
  const previousLabel = t(
    'aiComponents.branchSwitcher.previous.ariaLabel',
    'Previous version',
  );
  const nextLabel = t('aiComponents.branchSwitcher.next.ariaLabel', 'Next version');
  return (
    <div
      aria-label={t(
        'aiComponents.branchSwitcher.versions.ariaLabel',
        'Version {{ index }} of {{ total }}',
        { index, total: count },
      )}
      className={clsx('str-chat__ai-branch-switcher', className)}
      role='group'
    >
      <button
        aria-label={previousLabel}
        className='str-chat__ai-branch-switcher__button str-chat__ai-branch-switcher__button--previous'
        disabled={!hasPrevious}
        onClick={onPrevious}
        title={previousLabel}
        type='button'
      >
        <IconChevronLeft />
      </button>
      <span aria-hidden='true' className='str-chat__ai-branch-switcher__position'>
        {index}/{count}
      </span>
      <button
        aria-label={nextLabel}
        className='str-chat__ai-branch-switcher__button str-chat__ai-branch-switcher__button--next'
        disabled={!hasNext}
        onClick={onNext}
        title={nextLabel}
        type='button'
      >
        <IconChevronRight />
      </button>
    </div>
  );
};
