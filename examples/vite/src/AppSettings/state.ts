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

export const LEFT_PANEL_MIN_WIDTH = 360;
export const THREAD_PANEL_MIN_WIDTH = 360;

export type LeftPanelLayoutSettingsState = {
  collapsed: boolean;
  previousWidth: number;
  width: number;
};

export type ThreadPanelLayoutSettingsState = {
  width: number;
};

export type PanelLayoutSettingsState = {
  leftPanel: LeftPanelLayoutSettingsState;
  threadPanel: ThreadPanelLayoutSettingsState;
};

export type AppSettingsState = {
  chatView: ChatViewSettingsState;
  notifications: NotificationsSettingsState;
  panelLayout: PanelLayoutSettingsState;
  reactions: ReactionsSettingsState;
  theme: ThemeSettingsState;
};

const panelLayoutStorageKey = 'stream-chat-react:example-panel-layout';
const themeStorageKey = 'stream-chat-react:example-theme-mode';
const themeUrlParam = 'theme';

const clamp = (value: number, min: number, max?: number) => {
  const minClampedValue = Math.max(min, value);

  if (typeof max !== 'number') return minClampedValue;

  return Math.min(max, minClampedValue);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const defaultAppSettingsState: AppSettingsState = {
  chatView: {
    iconOnly: true,
  },
  notifications: {
    verticalAlignment: 'bottom',
  },
  panelLayout: {
    leftPanel: {
      collapsed: false,
      previousWidth: LEFT_PANEL_MIN_WIDTH,
      width: LEFT_PANEL_MIN_WIDTH,
    },
    threadPanel: {
      width: THREAD_PANEL_MIN_WIDTH,
    },
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

const normalizePanelLayoutSettings = (
  value: unknown,
): PanelLayoutSettingsState | undefined => {
  if (!isRecord(value)) return;

  const leftPanel = isRecord(value.leftPanel) ? value.leftPanel : undefined;
  const threadPanel = isRecord(value.threadPanel) ? value.threadPanel : undefined;

  const leftPanelWidth = clamp(
    typeof leftPanel?.width === 'number'
      ? leftPanel.width
      : defaultAppSettingsState.panelLayout.leftPanel.width,
    LEFT_PANEL_MIN_WIDTH,
  );
  const leftPanelPreviousWidth = clamp(
    typeof leftPanel?.previousWidth === 'number'
      ? leftPanel.previousWidth
      : leftPanelWidth,
    LEFT_PANEL_MIN_WIDTH,
  );
  const threadPanelWidth = clamp(
    typeof threadPanel?.width === 'number'
      ? threadPanel.width
      : defaultAppSettingsState.panelLayout.threadPanel.width,
    THREAD_PANEL_MIN_WIDTH,
  );

  return {
    leftPanel: {
      collapsed: leftPanel?.collapsed === true,
      previousWidth: leftPanelPreviousWidth,
      width: leftPanelWidth,
    },
    threadPanel: {
      width: threadPanelWidth,
    },
  };
};

const getStoredPanelLayoutSettings = (): PanelLayoutSettingsState | undefined => {
  if (typeof window === 'undefined') return;

  try {
    const storedPanelLayout = window.localStorage.getItem(panelLayoutStorageKey);

    if (!storedPanelLayout) return;

    return normalizePanelLayoutSettings(JSON.parse(storedPanelLayout));
  } catch {
    return;
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

const persistPanelLayoutSettings = (panelLayout: PanelLayoutSettingsState) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(panelLayoutStorageKey, JSON.stringify(panelLayout));
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
  panelLayout: getStoredPanelLayoutSettings() ?? defaultAppSettingsState.panelLayout,
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

appSettingsStore.subscribeWithSelector(
  ({ panelLayout }) => panelLayout,
  (panelLayout) => {
    persistPanelLayoutSettings(panelLayout);
  },
);

export const updatePanelLayoutSettings = (
  updater: (panelLayout: PanelLayoutSettingsState) => PanelLayoutSettingsState,
) => {
  appSettingsStore.partialNext({
    panelLayout: updater(appSettingsStore.getLatestValue().panelLayout),
  });
};

export const useAppSettingsSelector = <
  T extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(
  selector: (state: AppSettingsState) => T,
): T => useStateStore(appSettingsStore, selector) ?? selector(initialAppSettingsState);

export const useAppSettingsState = () =>
  useAppSettingsSelector((nextValue: AppSettingsState) => nextValue);
