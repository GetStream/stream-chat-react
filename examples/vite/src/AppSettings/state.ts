import { StateStore } from 'stream-chat';

import type { UploadFailureMode } from '../SendWhilePendingUploads';
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
  direction: 'ltr' | 'rtl';
  mode: 'dark' | 'light';
};

export type NotificationsSettingsState = {
  verticalAlignment: 'bottom' | 'top';
};

export type MessageActionsSettingsState = {
  customMessageActions: {
    delete: {
      enableOptionConfiguration: boolean;
    };
    inlineEdit: boolean;
    markOwnUnread: boolean;
    viewMessageInfo: boolean;
  };
};

export type ChannelMembersHeaderActionForm = 'menu' | 'quick';
export type ChannelMembersHeaderActionId = 'addMembers' | 'removeMembers';

export type ChannelDetailSettingsState = {
  modal: {
    channelMembersView: {
      headerActions: Record<
        ChannelMembersHeaderActionId,
        {
          enabled: boolean;
          form: ChannelMembersHeaderActionForm;
        }
      >;
    };
  };
};

export const LEFT_PANEL_MIN_WIDTH = 260;
export const THREAD_PANEL_MIN_WIDTH = 260;

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

export type MessageListSettingsState = {
  type: 'standard' | 'virtualized';
};

export type ComposerSettingsState = {
  /**
   * POC: allow sending a message while its attachments are still uploading.
   * Off by default — it swaps composer middleware and shadows a prototype getter,
   * so the app should behave exactly like stock until it is turned on.
   */
  sendMessagesWithPendingUploads: boolean;
  /**
   * Dev harness: which uploads should fail instead of completing. `prefixed` fails only files
   * whose name starts with `fail-`, which is how a partial failure (and the retry that follows)
   * can be reproduced.
   */
  failUploads: UploadFailureMode;
  /** Delay (ms) applied to every upload while `slowUploads` is on. */
  slowUploadMs: number;
  /**
   * Dev harness, independent of `sendMessagesWithPendingUploads`: stretches every upload over
   * `slowUploadMs` so the in-flight and confirmation-pending windows last long enough to observe.
   * Useful for watching the default blocked behaviour too.
   */
  slowUploads: boolean;
};

export type AppSettingsState = {
  channelDetail: ChannelDetailSettingsState;
  chatView: ChatViewSettingsState;
  composer: ComposerSettingsState;
  messageActions: MessageActionsSettingsState;
  messageList: MessageListSettingsState;
  notifications: NotificationsSettingsState;
  panelLayout: PanelLayoutSettingsState;
  reactions: ReactionsSettingsState;
  theme: ThemeSettingsState;
};

const panelLayoutStorageKey = 'stream-chat-react:example-panel-layout';
const themeStorageKey = 'stream-chat-react:example-theme-mode';
const directionStorageKey = 'stream-chat-react:example-direction';
const themeUrlParam = 'theme';

const clamp = (value: number, min: number, max?: number) => {
  const minClampedValue = Math.max(min, value);

  if (typeof max !== 'number') return minClampedValue;

  return Math.min(max, minClampedValue);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const defaultAppSettingsState: AppSettingsState = {
  channelDetail: {
    modal: {
      channelMembersView: {
        headerActions: {
          addMembers: {
            enabled: true,
            form: 'quick',
          },
          removeMembers: {
            enabled: false,
            form: 'menu',
          },
        },
      },
    },
  },
  chatView: {
    iconOnly: true,
  },
  composer: {
    failUploads: 'off',
    sendMessagesWithPendingUploads: false,
    slowUploadMs: 20000,
    slowUploads: false,
  },
  messageActions: {
    customMessageActions: {
      delete: {
        enableOptionConfiguration: false,
      },
      inlineEdit: false,
      markOwnUnread: false,
      viewMessageInfo: false,
    },
  },
  messageList: {
    type: 'standard',
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
    direction: 'ltr',
    mode: 'light',
  },
};

const getStoredDirection = (): ThemeSettingsState['direction'] | undefined => {
  if (typeof window === 'undefined') return;

  try {
    const stored = window.localStorage.getItem(directionStorageKey);

    if (stored === 'ltr' || stored === 'rtl') {
      return stored;
    }
  } catch {
    return;
  }
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

const slowUploadUrlParam = 'slow_upload';

/** Seeded from `?slow_upload=<ms>` so a link can carry a specific delay. */
const getSlowUploadMsFromUrl = (): number | undefined => {
  if (typeof window === 'undefined') return;

  const raw = new URLSearchParams(window.location.search).get(slowUploadUrlParam);
  if (raw === null) return;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const sendMessagesWithPendingUploadsUrlParam = 'send_messages_with_pending_uploads';

/**
 * Deliberately URL-seeded only — never persisted to localStorage. The POC mode has to be
 * off on a fresh load, so a stale stored value must not be able to turn it on.
 */
const getSendMessagesWithPendingUploadsFromUrl = (): boolean | undefined => {
  if (typeof window === 'undefined') return;

  const raw = new URLSearchParams(window.location.search).get(
    sendMessagesWithPendingUploadsUrlParam,
  );

  if (raw === null) return;

  return raw !== '0' && raw !== 'false';
};

const getThemeModeFromUrl = (): ThemeSettingsState['mode'] | undefined => {
  if (typeof window === 'undefined') return;

  const themeMode = new URLSearchParams(window.location.search).get(themeUrlParam);

  if (themeMode === 'dark' || themeMode === 'light') {
    return themeMode;
  }
};

const persistDirection = (direction: ThemeSettingsState['direction']) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(directionStorageKey, direction);
  } catch {
    // ignore persistence failures in environments where localStorage is unavailable
  }
};

const applyDirection = (direction: ThemeSettingsState['direction']) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('dir', direction);
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
  composer: {
    ...defaultAppSettingsState.composer,
    sendMessagesWithPendingUploads:
      getSendMessagesWithPendingUploadsFromUrl() ??
      defaultAppSettingsState.composer.sendMessagesWithPendingUploads,
    slowUploadMs:
      getSlowUploadMsFromUrl() ?? defaultAppSettingsState.composer.slowUploadMs,
    // A delay in the URL means the harness is wanted, so it arms the switch too.
    slowUploads: (getSlowUploadMsFromUrl() ?? 0) > 0,
  },
  panelLayout: getStoredPanelLayoutSettings() ?? defaultAppSettingsState.panelLayout,
  theme: {
    ...defaultAppSettingsState.theme,
    direction: getStoredDirection() ?? defaultAppSettingsState.theme.direction,
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
  ({ theme }) => ({ direction: theme.direction }),
  ({ direction }) => {
    persistDirection(direction);
    applyDirection(direction);
  },
);

// Apply initial direction on load
applyDirection(initialAppSettingsState.theme.direction);

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
