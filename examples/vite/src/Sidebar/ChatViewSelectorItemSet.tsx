import {
  type ChatViewSelectorEntry,
  defaultChatViewSelectorItemSet,
} from 'stream-chat-react/slot-layout';
import { AppSettings } from '../AppSettings';

export const chatViewSelectorItemSet: ChatViewSelectorEntry[] = [
  ...defaultChatViewSelectorItemSet,
  { Component: AppSettings, type: 'settings' },
];
