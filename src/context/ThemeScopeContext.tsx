import clsx from 'clsx';
import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

import { useChatContext } from './ChatContext';

/**
 * Whether the subtree already renders inside an element carrying the `str-chat <theme>` scope that
 * the design tokens hang off. `.str-chat` declares the whole token set, so a second one nested
 * inside the first would reset every token an app overrides on the outer element. Components that
 * also render standalone (the channel navigation, a channel list) therefore apply the scope only
 * when nothing above them has.
 */
const ThemeScopeContext = createContext(false);

/** Marks its subtree as rendering inside the `str-chat <theme>` scope. */
export const ThemeScopeProvider = ({ children }: PropsWithChildren) => (
  <ThemeScopeContext.Provider value={true}>{children}</ThemeScopeContext.Provider>
);

export const useIsInThemeScope = () => useContext(ThemeScopeContext);

/** The scope's classes: `customClasses.chat` (default `str-chat`) and the `Chat` theme. */
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
