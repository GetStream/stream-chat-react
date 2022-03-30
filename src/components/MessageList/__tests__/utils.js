import { v4 as uuidV4 } from 'uuid';

import { generateMessage } from '../../../mock-builders';

import { processMessages } from '../utils';

const myUserId = uuidV4();
const otherUserId = uuidV4();
const enableSeparatorInThreadParams = { enableThreadDateSeparator: true, threadList: true };

const runMessageProcessing = (msgData, processMsgParams = {}) => {
  const messages = msgData.map((msg) => generateMessage(msg));
  return {
    messages,
    newMessageList: processMessages({ messages, userId: myUserId, ...processMsgParams }),
  };
};

const dateSeparatorInsertedAt = (expectedWhere, messages, newMessageList, unread) => {
  if (!expectedWhere) {
    throw new Error('Missing "where"');
  }

  expect(newMessageList).toHaveLength(expectedWhere.length + messages.length);

  const startDateMsg = {
    customType: 'message.date',
    date: messages[0].created_at,
    id: messages[0].id,
  };
  const midDateMsg = {
    customType: 'message.date',
    date: messages[1].created_at,
    id: messages[1].id,
  };
  if (unread) {
    startDateMsg.unread = unread;
    midDateMsg.unread = unread;
  }

  // beginning + mid
  if (expectedWhere[0] === 'start' && expectedWhere[1] === 'mid') {
    expect(newMessageList[0]).toMatchObject(startDateMsg);
    expect(newMessageList[1]).toMatchObject(messages[0]);
    expect(newMessageList[2]).toMatchObject(midDateMsg);
    expect(newMessageList[3]).toMatchObject(messages[1]);
  } else if (expectedWhere[0] === 'start') {
    expect(newMessageList[0]).toMatchObject(startDateMsg);
    expect(newMessageList[1]).toMatchObject(messages[0]);
    expect(newMessageList[2]).toMatchObject(messages[1]);
  } else if (expectedWhere[0] === 'mid') {
    expect(newMessageList[0]).toMatchObject(messages[0]);
    expect(newMessageList[1]).toMatchObject(midDateMsg);
    expect(newMessageList[2]).toMatchObject(messages[1]);
  }
};

describe('processMessages', () => {
  it('returns empty list of messages', () => {
    expect(processMessages({ messages: [], userId: myUserId })).toHaveLength(0);
  });

  describe('hides deleted messages', () => {
    const messagesData = [{}, { type: 'deleted' }, {}];

    it('disabled by default in main msg list', () => {
      const { messages, newMessageList } = runMessageProcessing(messagesData, {
        disableDateSeparator: true,
      });
      expect(newMessageList).toHaveLength(3);
      newMessageList.forEach((newMsg, i) => {
        expect(newMsg).toMatchObject(messages[i]);
      });
    });

    it('disabled by default in thread', () => {
      const { messages, newMessageList } = runMessageProcessing(messagesData, { threadList: true });
      expect(newMessageList).toHaveLength(3);
      newMessageList.forEach((newMsg, i) => {
        expect(newMsg).toMatchObject(messages[i]);
      });
    });

    it('if enabled in main msg list', () => {
      const { messages, newMessageList } = runMessageProcessing(messagesData, {
        disableDateSeparator: true,
        hideDeletedMessages: true,
      });
      expect(newMessageList).toHaveLength(2);
      expect(newMessageList[0]).toMatchObject(messages[0]);
      expect(newMessageList[1]).toMatchObject(messages[2]);
    });

    it('if enabled in thread', () => {
      const { messages, newMessageList } = runMessageProcessing(messagesData, {
        hideDeletedMessages: true,
        threadList: true,
      });
      expect(newMessageList).toHaveLength(2);
      expect(newMessageList[0]).toMatchObject(messages[0]);
      expect(newMessageList[1]).toMatchObject(messages[2]);
    });
  });

  describe('date separator', () => {
    describe('no insertion at all', () => {
      const msgCreationDates = [
        { created_at: new Date('1970-01-01'), updated_at: new Date('1970-01-01') },
        { created_at: new Date('1970-01-01'), updated_at: new Date('1970-01-01') },
      ];
      it('has to be enabled in the main message list', () => {
        const { messages, newMessageList } = runMessageProcessing(msgCreationDates, {
          disableDateSeparator: true,
        });
        dateSeparatorInsertedAt([], messages, newMessageList);
      });
      it('is disabled in thread by default', () => {
        const { messages, newMessageList } = runMessageProcessing(msgCreationDates, {
          threadList: true,
        });
        dateSeparatorInsertedAt([], messages, newMessageList);
      });
    });

    describe('inserted only at the beginning', () => {
      const expectedWhere = ['start'];
      const msgData = { created_at: new Date('1970-01-01'), updated_at: new Date('1970-01-01') };
      it('messages were created on the same day', () => {
        const msgCreationDates = [msgData, msgData];
        const { messages, newMessageList } = runMessageProcessing(msgCreationDates);
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });
    });

    describe('inserted at the beginning & between the messages', () => {
      const expectedWhere = ['start', 'mid'];
      const msgCreationDates = [
        { created_at: new Date('1970-01-01'), updated_at: new Date('1970-01-01') },
        { created_at: new Date('1970-01-02'), updated_at: new Date('1970-01-02') },
      ];
      it('messages were created on a different day in the main msg list', () => {
        const { messages, newMessageList } = runMessageProcessing(msgCreationDates);
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('messages were created on a different day in thread', () => {
        const { messages, newMessageList } = runMessageProcessing(
          msgCreationDates,
          enableSeparatorInThreadParams,
        );
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      const msgCreationDatesFirstInvalid = [
        { created_at: new Date('1970-01-00'), updated_at: new Date('1970-01-00') },
        { created_at: new Date('1970-01-01'), updated_at: new Date('1970-01-01') },
      ];

      it('first message contains invalid date in the main msg list', () => {
        const { messages, newMessageList } = runMessageProcessing(msgCreationDatesFirstInvalid);
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('first message contains invalid date in thread', () => {
        const { messages, newMessageList } = runMessageProcessing(
          msgCreationDatesFirstInvalid,
          enableSeparatorInThreadParams,
        );
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });
      const msgCreationDatesSecondInvalid = [
        { created_at: new Date('1970-01-31'), updated_at: new Date('1970-01-31') },
        { created_at: new Date('1970-02-00'), updated_at: new Date('1970-02-00') },
      ];
      it('second message contains invalid date in the main msg list', () => {
        const { messages, newMessageList } = runMessageProcessing(msgCreationDatesSecondInvalid);
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('second message contains invalid date in thread', () => {
        const { messages, newMessageList } = runMessageProcessing(
          msgCreationDatesSecondInvalid,
          enableSeparatorInThreadParams,
        );
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });
    });

    describe('for unread messages', () => {
      const expectedWhere = ['start'];
      const shouldExpectUnreadSeparator = true;
      const lastRead = new Date();
      const oldMsg = { created_at: new Date('1970-01-01'), updated_at: new Date('1970-01-01') };
      const unreadMsg = { created_at: new Date('9999-12-31'), updated_at: new Date('9999-12-31') };
      const myNewMessages = [
        { user: { id: myUserId }, ...unreadMsg },
        { user: { id: myUserId }, ...unreadMsg },
      ];
      const incomingNewMessages = [
        { user: { id: otherUserId }, ...unreadMsg },
        { user: { id: otherUserId }, ...unreadMsg },
      ];
      const incomingOldMessages = [
        { user: { id: otherUserId }, ...oldMsg },
        { user: { id: otherUserId }, ...oldMsg },
      ];

      it('showed from others in main msg list', () => {
        const { messages, newMessageList } = runMessageProcessing(incomingNewMessages, {
          lastRead,
        });
        dateSeparatorInsertedAt(
          expectedWhere,
          messages,
          newMessageList,
          shouldExpectUnreadSeparator,
        );
      });

      it('not showed from others in main msg list if read', () => {
        const { messages, newMessageList } = runMessageProcessing(incomingOldMessages, {
          lastRead,
        });
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('not showed from others in main msg list if hideNewMessageSeparator enabled', () => {
        const { messages, newMessageList } = runMessageProcessing(incomingNewMessages, {
          hideNewMessageSeparator: true,
          lastRead,
        });
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('not from me in main msg list', () => {
        const { messages, newMessageList } = runMessageProcessing(myNewMessages, { lastRead });
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('showed from others in thread', () => {
        const { messages, newMessageList } = runMessageProcessing(incomingNewMessages, {
          lastRead,
          ...enableSeparatorInThreadParams,
        });
        dateSeparatorInsertedAt(
          expectedWhere,
          messages,
          newMessageList,
          shouldExpectUnreadSeparator,
        );
      });
      it('not showed from others in thread if read', () => {
        const { messages, newMessageList } = runMessageProcessing(incomingOldMessages, {
          lastRead,
          ...enableSeparatorInThreadParams,
        });
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('not showed from others in thread if hideNewMessageSeparator enabled', () => {
        const { messages, newMessageList } = runMessageProcessing(incomingNewMessages, {
          ...enableSeparatorInThreadParams,
          hideNewMessageSeparator: true,
          lastRead,
        });
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('not from me in thread', () => {
        const { messages, newMessageList } = runMessageProcessing(myNewMessages, {
          lastRead,
          ...enableSeparatorInThreadParams,
        });
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });
    });
  });

  describe('giphy preview message', () => {
    const setGiphyPreviewMessageMock = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('is set if provided with preview message setter and messages contain ephemeral giphy message', () => {
      const messagesData = [{}, { command: 'giphy', type: 'ephemeral' }, {}];
      runMessageProcessing(messagesData, { setGiphyPreviewMessage: setGiphyPreviewMessageMock });
      expect(setGiphyPreviewMessageMock).toHaveBeenLastCalledWith(
        expect.objectContaining(messagesData[1]),
      );
    });
    it('is no set if not provided with preview message setter', () => {
      const messagesData = [{}, { command: 'giphy', type: 'ephemeral' }, {}];
      runMessageProcessing(messagesData);
      expect(setGiphyPreviewMessageMock).not.toHaveBeenCalled();
    });
    it('is set to undefined if messages do not contain ephemeral message', () => {
      const messagesData = [{}, { command: 'giphy' }, {}];
      runMessageProcessing(messagesData, { setGiphyPreviewMessage: setGiphyPreviewMessageMock });
      expect(setGiphyPreviewMessageMock).toHaveBeenLastCalledWith(undefined);
    });
    it('is no set to undefined if messages do not contain message of command giphy', () => {
      const messagesData = [{}, { type: 'ephemeral' }, {}];
      runMessageProcessing(messagesData, { setGiphyPreviewMessage: setGiphyPreviewMessageMock });
      expect(setGiphyPreviewMessageMock).toHaveBeenLastCalledWith(undefined);
    });
  });
});
