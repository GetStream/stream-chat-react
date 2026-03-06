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

export type AppSettingsState = {
  chatView: ChatViewSettingsState;
  reactions: ReactionsSettingsState;
};

const defaultAppSettingsState: AppSettingsState = {
  chatView: {
    iconOnly: true,
  },
  reactions: {
    flipHorizontalPosition: false,
    verticalPosition: 'top',
    visualStyle: 'clustered',
  },
};

export const appSettingsStore = new StateStore<AppSettingsState>(defaultAppSettingsState);

export const useAppSettingsState = () =>
  useStateStore(appSettingsStore, (nextValue: AppSettingsState) => nextValue) ??
  defaultAppSettingsState;
