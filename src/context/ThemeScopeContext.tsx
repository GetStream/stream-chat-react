import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

/**
 * Whether the subtree already renders inside the `str-chat <theme>` scope. A nested `.str-chat`
 * would reset every design token an app overrides on the outer element, so components that apply
 * the scope themselves, such as the AI components, add it only when nothing above them has.
 */
const ThemeScopeContext = createContext(false);

/** Marks its subtree as rendering inside the `str-chat <theme>` scope. */
export const ThemeScopeProvider = ({ children }: PropsWithChildren) => (
  <ThemeScopeContext.Provider value={true}>{children}</ThemeScopeContext.Provider>
);

export const useIsInThemeScope = () => useContext(ThemeScopeContext);
