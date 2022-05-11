import type { Page } from '@playwright/test';

import makeAutocompleteSuggestionItem from './components/AutocompleteSuggestionList';
import makeChannelPreview from './components/ChannelPreview';
import makeMsgInput from './components/MessageInput';
import makeMessageList from './components/MessageList/MessageList';
import makeMessageNotification from './components/MessageList/MessageNotification';
import messageSimple from './components/Message/MessageSimple';
import makeQuotedMessage from './components/Message/QuotedMessage';

export type TestingUser = ReturnType<typeof makeUser>;

export function makeUser(page: Page) {
  const AutocompleteSuggestionItem = makeAutocompleteSuggestionItem(page);
  const ChannelPreview = makeChannelPreview(page);
  const MessageList = makeMessageList(page);
  const MessageInput = makeMsgInput(page);
  const MessageNotification = makeMessageNotification(page);
  const MessageSimple = messageSimple(page);
  const QuotedMessage = makeQuotedMessage(page);


  return {
    clicks: {
      AutocompleteSuggestionItem: AutocompleteSuggestionItem.click,
      MessageNotification: MessageNotification.click,
      QuotedMessage: QuotedMessage.click,
    },
    get: {
      Message: MessageSimple.get,
      MessageNotification: MessageNotification.get,
      QuotedMessage: QuotedMessage.get,
    },
    sees: {
      Message: MessageSimple.see,
      MessageList: MessageList.see,
      ChannelPreview: ChannelPreview.see,
    },
    typesTo: {
      MessageInput: MessageInput.typeTo,
    }
  }
}
