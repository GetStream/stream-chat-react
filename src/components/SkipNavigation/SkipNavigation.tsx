import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';

export type SkipNavigationProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  /** Label of each link, given the target ID without `#`. Defaults to `Skip to {targetId}`. */
  getLinkLabel?: (targetId: string, index: number) => ReactNode;
  /** IDs of the elements that receive focus, by keyboard priority. A leading `#` is ignored. */
  targetIds: string[];
};

const normalizeTargetId = (targetId: string) =>
  targetId.startsWith('#') ? targetId.slice(1) : targetId;
const isActivationKey = (event: React.KeyboardEvent<HTMLAnchorElement>) =>
  event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';

type FocusCleanupState = {
  cleanup: () => void;
  hasTemporaryTabIndex: boolean;
};

const focusTargetElement = (
  targetId: string,
  focusCleanupRegistry: React.MutableRefObject<Map<HTMLElement, FocusCleanupState>>,
) => {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;

  const hasTabIndexAttribute = targetElement.hasAttribute('tabindex');
  if (!hasTabIndexAttribute) {
    targetElement.setAttribute('tabindex', '-1');
  }

  targetElement.focus();

  if (!hasTabIndexAttribute) {
    const existingFocusCleanup = focusCleanupRegistry.current.get(targetElement);
    if (existingFocusCleanup) {
      existingFocusCleanup.cleanup();
    }

    const handleBlur = () => {
      targetElement.removeAttribute('tabindex');
      focusCleanupRegistry.current.delete(targetElement);
    };

    targetElement.addEventListener('blur', handleBlur, { once: true });

    focusCleanupRegistry.current.set(targetElement, {
      cleanup: () => targetElement.removeEventListener('blur', handleBlur),
      hasTemporaryTabIndex: true,
    });
  }
};

/**
 * Skip links that move focus to the elements with the given IDs. Not rendered by `Chat`; render it
 * as the first focusable element of the layout.
 *
 * A target without a `tabindex` attribute gets a temporary `tabindex="-1"` until it blurs. An
 * `onClick` or `onKeyDown` that calls `event.preventDefault()` skips the focus move.
 *
 * @example
 * ```tsx
 * <SkipNavigation
 *   getLinkLabel={(targetId) =>
 *     targetId === 'my-message-composer-textarea'
 *       ? 'Skip to message composer'
 *       : 'Skip to channel messages'
 *   }
 *   targetIds={['my-message-composer-textarea', 'my-channel-root']}
 * />
 * ```
 */
export const SkipNavigation = ({
  className,
  getLinkLabel,
  onClick,
  onKeyDown,
  targetIds,
  ...anchorProps
}: SkipNavigationProps) => {
  const focusCleanupRegistry = useRef<Map<HTMLElement, FocusCleanupState>>(new Map());

  useEffect(
    () => () => {
      focusCleanupRegistry.current.forEach(
        ({ cleanup, hasTemporaryTabIndex }, targetElement) => {
          cleanup();
          if (hasTemporaryTabIndex && targetElement.getAttribute('tabindex') === '-1') {
            targetElement.removeAttribute('tabindex');
          }
        },
      );

      focusCleanupRegistry.current.clear();
    },
    [],
  );

  if (!targetIds.length) return null;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();
    focusTargetElement(targetId, focusCleanupRegistry);
  };
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLAnchorElement>,
    targetId: string,
  ) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !isActivationKey(event)) return;

    event.preventDefault();
    focusTargetElement(targetId, focusCleanupRegistry);
  };

  return (
    <>
      {targetIds.map((targetId, index) => {
        const normalizedTargetId = normalizeTargetId(targetId);
        const linkLabel =
          getLinkLabel?.(normalizedTargetId, index) ?? `Skip to ${normalizedTargetId}`;

        return (
          <a
            {...anchorProps}
            className={['str-chat__skip-navigation-link', className]
              .filter(Boolean)
              .join(' ')}
            href={`#${normalizedTargetId}`}
            key={`${normalizedTargetId}-${index}`}
            onClick={(event) => handleClick(event, normalizedTargetId)}
            onKeyDown={(event) => handleKeyDown(event, normalizedTargetId)}
          >
            {linkLabel}
          </a>
        );
      })}
    </>
  );
};
