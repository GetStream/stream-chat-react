import { StateStore } from 'stream-chat';
import { useStateStore } from 'stream-chat-react';

export type ReactionsSettingsState = {
  flipHorizontalPosition: boolean;
  verticalPosition: 'top' | 'bottom';
  visualStyle: 'clustered' | 'segmented';
};

export type AppSettingsState = {
  reactions: ReactionsSettingsState;
};

const defaultAppSettingsState: AppSettingsState = {
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
