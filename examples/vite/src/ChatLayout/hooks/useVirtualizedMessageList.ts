import { useAppSettingsSelector } from '../../AppSettings/state';

// Whether the app-settings "message list" toggle is set to the virtualized list. Read the same
// way everywhere so every channel and thread honors the setting (not just the primary channel).
export const useVirtualizedMessageList = () =>
  useAppSettingsSelector((s) => s.messageList).type === 'virtualized';
