import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';

/**
 * `SkipNavigation` is an opt-in skip links helper for integrators and is not rendered by `Chat`.
 *
 * Intended integration:
 * - Render as the first keyboard-focusable element in your chat layout.
 * - Pass `targetIds` ordered by keyboard priority (for example message composer first).
 * - Each value must be a DOM id (without `#`) so links keep native hash navigation semantics.
 *
 * Activation behavior:
 * - Renders one link per target id.
 * - Keeps native hash-link behavior via `href="#{targetId}"`.
 * - Programmatically moves focus to each target element for reliable keyboard navigation.
 * - If the target is not naturally focusable, temporarily applies `tabindex="-1"` and
 *   removes it on blur.
 *
 * The caller can intercept activation by passing `onClick` and calling `event.preventDefault()`.
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
export type SkipNavigationProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  /** Optional per-link label generator. Defaults to `Skip to {targetId}`. */
  getLinkLabel?: (targetId: string, index: number) => ReactNode;
  /** Ordered DOM ids of elements that should receive focus when links are activated. */
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

    // Move keyboard focus to the target element and keep hash-link fallback behavior.
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
