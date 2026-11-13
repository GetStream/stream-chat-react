import React from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';

/**
 * Which of a message's versions shows, and how to show the others: a reply written again, or a
 * question the person edited. `index` is 1-based.
 */
export type AIBranchSwitch = {
  /** How many versions there are. The switcher shows only when there are two or more. */
  count: number;
  /** Which version shows, from 1 to `count`. */
  index: number;
  /** Shows the next version. Without it, the next arrow is disabled. */
  onNext?: () => void;
  /** Shows the previous version. Without it, the previous arrow is disabled. */
  onPrevious?: () => void;
};

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
