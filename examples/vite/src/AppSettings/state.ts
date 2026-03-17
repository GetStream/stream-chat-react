import { StateStore } from 'stream-chat';
import { useStateStore } from 'stream-chat-react';

export type ReactionsSettingsState = {
  flipHorizontalPosition: boolean;
  verticalPosition: 'top' | 'bottom';
  visualStyle: 'clustered' | 'segmented';
};

export type ChatViewSettingsState = {
  iconOnly: boolean;
};

export type ThemeSettingsState = {
  mode: 'dark' | 'light';
};

export type NotificationsSettingsState = {
  verticalAlignment: 'bottom' | 'top';
};

export type AppSettingsState = {
  chatView: ChatViewSettingsState;
  notifications: NotificationsSettingsState;
  reactions: ReactionsSettingsState;
  theme: ThemeSettingsState;
};

const themeStorageKey = 'stream-chat-react:example-theme-mode';
const themeUrlParam = 'theme';

const defaultAppSettingsState: AppSettingsState = {
  chatView: {
    iconOnly: true,
  },
  notifications: {
    verticalAlignment: 'bottom',
  },
  reactions: {
    flipHorizontalPosition: false,
    verticalPosition: 'top',
    visualStyle: 'clustered',
  },
  theme: {
    mode: 'light',
  },
};

const getStoredThemeMode = (): ThemeSettingsState['mode'] | undefined => {
  if (typeof window === 'undefined') return;

  let storedThemeMode: string | null = null;

  try {
    storedThemeMode = window.localStorage.getItem(themeStorageKey);
  } catch {
    return;
  }

  if (storedThemeMode === 'dark' || storedThemeMode === 'light') {
    return storedThemeMode;
  }
};

const getThemeModeFromUrl = (): ThemeSettingsState['mode'] | undefined => {
  if (typeof window === 'undefined') return;

  const themeMode = new URLSearchParams(window.location.search).get(themeUrlParam);

  if (themeMode === 'dark' || themeMode === 'light') {
    return themeMode;
  }
};

const persistThemeMode = (themeMode: ThemeSettingsState['mode']) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(themeStorageKey, themeMode);
  } catch {
    // ignore persistence failures in environments where localStorage is unavailable
  }
};

const persistThemeModeInUrl = (themeMode: ThemeSettingsState['mode']) => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);

  if (url.searchParams.get(themeUrlParam) === themeMode) return;

  url.searchParams.set(themeUrlParam, themeMode);

  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
};

const initialAppSettingsState: AppSettingsState = {
  ...defaultAppSettingsState,
  theme: {
    ...defaultAppSettingsState.theme,
    mode:
      getThemeModeFromUrl() ?? getStoredThemeMode() ?? defaultAppSettingsState.theme.mode,
  },
};

export const appSettingsStore = new StateStore<AppSettingsState>(initialAppSettingsState);

appSettingsStore.subscribeWithSelector(
  ({ theme }) => ({ mode: theme.mode }),
  ({ mode }) => {
    persistThemeMode(mode);
    persistThemeModeInUrl(mode);
  },
);

export const useAppSettingsState = () =>
  useStateStore(appSettingsStore, (nextValue: AppSettingsState) => nextValue) ??
  initialAppSettingsState;
