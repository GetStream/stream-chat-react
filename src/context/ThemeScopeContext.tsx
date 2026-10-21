import clsx from 'clsx';
import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

import { useChatContext } from './ChatContext';

/**
 * Whether the subtree already renders inside the `str-chat <theme>` scope. A nested `.str-chat`
 * would reset every design token an app overrides on the outer element, so standalone components
 * apply the scope only when nothing above them has.
 */
const ThemeScopeContext = createContext(false);

/** Marks its subtree as rendering inside the `str-chat <theme>` scope. */
export const ThemeScopeProvider = ({ children }: PropsWithChildren) => (
  <ThemeScopeContext.Provider value={true}>{children}</ThemeScopeContext.Provider>
);

export const useIsInThemeScope = () => useContext(ThemeScopeContext);

/** The scope's classes: the `Chat` theme and `customClasses.chat`, which defaults to `str-chat`. */
export const useThemeScopeClassName = () => {
  const { customClasses, theme } = useChatContext();
  return clsx(customClasses?.chat ?? 'str-chat', theme);
};

/**
 * Renders its children inside the `str-chat <theme>` scope, adding a layout-neutral
 * (`display: contents`) wrapper only when no ancestor provides the scope.
 */
export const ThemeScope = ({ children }: PropsWithChildren) => {
  const isInThemeScope = useIsInThemeScope();
  const themeScopeClassName = useThemeScopeClassName();

  if (isInThemeScope) return <>{children}</>;

  return (
    <div className={clsx(themeScopeClassName, 'str-chat__theme-scope')}>
      <ThemeScopeProvider>{children}</ThemeScopeProvider>
    </div>
  );
};
