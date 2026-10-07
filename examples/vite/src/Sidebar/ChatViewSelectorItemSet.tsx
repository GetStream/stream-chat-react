import {
  type ChatViewSelectorEntry,
  defaultChatViewSelectorItemSet,
} from 'stream-chat-react/slot-layout';
import { AppSettings } from '../AppSettings';
import { NewConversationButton } from '../NewConversation';
import { UserProfileButton } from '../UserProfile';

export const chatViewSelectorItemSet: ChatViewSelectorEntry[] = [
  ...defaultChatViewSelectorItemSet,
  { Component: NewConversationButton, type: 'new-conversation' },
  { Component: AppSettings, type: 'settings' },
  { Component: UserProfileButton, type: 'profile' },
];
