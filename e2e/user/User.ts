import type { Page } from '@playwright/test';

import makeChannelPreview from './components/ChannelPreview';
import messageList from './components/MessageList';
import {actions as makeAutocompleteSuggestionItemActions} from './components/AutocompleteSuggestionList';
import {actions as makeMsgInputActions} from './components/MessageInput';


export function makeUser(page: Page) {
  const AutocompleteSuggestionItems = makeAutocompleteSuggestionItemActions(page);
  const msgInputActions = makeMsgInputActions(page);

  return {
    clicks: {
      AutocompleteSuggestionItem: AutocompleteSuggestionItems.click
    },
    sees: {
      MessageList: messageList(page),
      ChannelPreview: makeChannelPreview(page)
    },
    typesTo: {
      MessageInput: { text: msgInputActions.typeIn}
    }
  }
}

export type TestingUser = ReturnType<typeof makeUser>;
