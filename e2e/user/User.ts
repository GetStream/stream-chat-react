import type { Page } from '@playwright/test';

import makeAutocompleteSuggestionItem from './components/AutocompleteSuggestionList';
import makeChannelPreview from './components/ChannelPreview';
import makeMessageActionsBox from './components/MessageActions/MessageActionsBox';
import makeMessageActions from './components/MessageActions/MessageActions';
import makeMsgInput from './components/MessageInput';
import makeMessageList from './components/MessageList/MessageList';
import makeMessageNotification from './components/MessageList/MessageNotification';
import messageSimple from './components/Message/MessageSimple';
import makeQuotedMessage from './components/Message/QuotedMessage';
import makeThread from './components/Thread/Thread';
import makeModal from './components/Modal/Modal';

export type TestingUser = ReturnType<typeof makeUser>;

export function makeUser(page: Page) {
  const AutocompleteSuggestionItem = makeAutocompleteSuggestionItem(page);
  const ChannelPreview = makeChannelPreview(page);
  const MessageActionsBox = makeMessageActionsBox(page);
  const MessageActions = makeMessageActions(page);
  const MessageList = makeMessageList(page);
  const MessageInput = makeMsgInput(page);
  const MessageNotification = makeMessageNotification(page);
  const MessageSimple = messageSimple(page);
  const QuotedMessage = makeQuotedMessage(page);
  const Thread = makeThread(page);
  const Modal = makeModal(page);

  return {
    clicks: {
      AutocompleteSuggestionItem: AutocompleteSuggestionItem.click,
      ChannelPreview: ChannelPreview.click,
      MessageActions: MessageActions.click,
      MessageActionsBox: MessageActionsBox.click,
      MessageNotification: MessageNotification.click,
      Modal: Modal.click,
      QuotedMessage: QuotedMessage.click,
      Thread: Thread.click,
    },
    get: {
      Message: MessageSimple.get,
      MessageList: MessageList.get,
      MessageNotification: MessageNotification.get,
      QuotedMessage: QuotedMessage.get,
      Thread: Thread.get,
    },
    sees: {
      ChannelPreview: ChannelPreview.see,
      Message: MessageSimple.see,
      MessageList: MessageList.see,
      Thread: Thread.see,
    },
    submits: {
      MessageInput: MessageInput.submit,
    },
    typesTo: {
      MessageInput: MessageInput.typeTo,
    },
  };
}
