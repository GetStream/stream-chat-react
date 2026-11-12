import clsx from 'clsx';
import React, { useContext } from 'react';
import type { PropsWithChildren } from 'react';

import { ChatContext } from '../../context/ChatContext';
import { ThemeScopeProvider, useIsInThemeScope } from '../../context/ThemeScopeContext';

/**
 * The `str-chat <theme>` scope classes for an AI component's root, or `undefined` when an ancestor
 * (`ChatView`, `Channel`, `ChannelNavigation` or another AI component) already provides the scope.
 * A nested `.str-chat` would reset the design tokens an app overrides on the outer element.
 *
 * Unlike the main SDK's scope, it does not require `Chat`: the AI components also render without
 * one, and there they get the plain `str-chat` scope, with no theme.
 *
 * A component puts the classes on its own root element and renders its children inside
 * `ThemeScopeProvider`, so the AI components inside it don't add a scope of their own.
 */
export const useAIThemeScopeClassName = (): string | undefined => {
  const isInThemeScope = useIsInThemeScope();
  const chatContext = useContext(ChatContext);
  if (isInThemeScope) return undefined;
  return clsx(chatContext?.customClasses?.chat ?? 'str-chat', chatContext?.theme);
};

/**
 * The scope for an AI component with no single root element of its own, such as `AIMarkdown`:
 * a layout-neutral (`display: contents`) wrapper, added only when no ancestor provides the scope.
 */
export const AIThemeScope = ({ children }: PropsWithChildren) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  if (!themeScopeClassName) return <>{children}</>;
  return (
    <div className={clsx(themeScopeClassName, 'str-chat__theme-scope')}>
      <ThemeScopeProvider>{children}</ThemeScopeProvider>
    </div>
  );
};

export { ThemeScopeProvider };
