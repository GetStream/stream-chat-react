import {
  type ChatViewSelectorEntry,
  defaultChatViewSelectorItemSet,
} from 'stream-chat-react';
import { AppSettings } from '../AppSettings';

export const chatViewSelectorItemSet: ChatViewSelectorEntry[] = [
  ...defaultChatViewSelectorItemSet,
  { Component: AppSettings, type: 'settings' },
];
