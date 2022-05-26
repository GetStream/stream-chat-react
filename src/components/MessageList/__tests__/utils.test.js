import { generateMessage } from '../../../mock-builders';

import { makeDateMessageId, processMessages } from '../utils';
import { CUSTOM_MESSAGE_TYPE } from '../../../constants/messageTypes';

const mockedNanoId = 'V1StGXR8_Z5jdHi6B-myT';
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => mockedNanoId),
}));

const myUserId = 'myUserId';
const otherUserId = 'otherUserId';
const enableDateSeparatorParams = { enableDateSeparator: true };

const msgCreationDatesSameDay = [
  { created_at: new Date('1970-01-01'), updated_at: new Date('1970-01-01') },
  { created_at: new Date('1970-01-01'), updated_at: new Date('1970-01-01') },
];
const msgCreationDatesDifferentDay = [
  { created_at: new Date('1970-01-01'), updated_at: new Date('1970-01-01') },
  { created_at: new Date('1970-01-02'), updated_at: new Date('1970-01-02') },
];
const msgCreationDatesFirstInvalid = [
  { created_at: new Date('1970-01-00'), updated_at: new Date('1970-01-00') },
  { created_at: new Date('1970-01-01'), updated_at: new Date('1970-01-01') },
];
const msgCreationDatesSecondInvalid = [
  { created_at: new Date('1970-01-31'), updated_at: new Date('1970-01-31') },
  { created_at: new Date('1970-02-00'), updated_at: new Date('1970-02-00') },
];

const runMessageProcessing = (msgData, processMsgParams = {}) => {
  const messages = msgData.map((msg) => generateMessage(msg));
  return {
    messages,
    newMessageList: processMessages({ messages, userId: myUserId, ...processMsgParams }),
  };
};

const makeDateSeparator = (message) => ({
  customType: 'message.date',
  date: message.created_at,
  id: makeDateMessageId(message.created_at),
});

const dateSeparatorInsertedAt = (expectedWhere, messages, newMessageList, unread) => {
  if (!expectedWhere) {
    throw new Error('Missing "where"');
  }

  expect(newMessageList).toHaveLength(expectedWhere.length + messages.length);

  const startDateMsg = makeDateSeparator(messages[0]);
  const midDateMsg = makeDateSeparator(messages[1]);

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

describe('makeDateMessageId', () => {
  it('takes a date string and generates string in format "message.date-<message.created_at>"', () => {
    expect(makeDateMessageId('1970-01-01')).toBe('message.date-1970-01-01');
  });
  it('takes a Date object and generates string in format "message.date-<message.created_at-ISOstring>"', () => {
    expect(makeDateMessageId(new Date('1970-01-01').toISOString())).toBe(
      'message.date-1970-01-01T00:00:00.000Z',
    );
  });
  it('generates string in format "message.date-<nanoid>" if no date provided', () => {
    expect(makeDateMessageId()).toBe(`message.date-${mockedNanoId}`);
  });
});

describe('processMessages', () => {
  it('returns empty list of messages', () => {
    expect(processMessages({ messages: [], userId: myUserId })).toHaveLength(0);
  });

  describe('hiding deleted messages', () => {
    const messagesData = [{}, { type: 'deleted' }, {}];

    it('is disabled by default', () => {
      const { messages, newMessageList } = runMessageProcessing(messagesData);
      expect(newMessageList).toHaveLength(3);
      newMessageList.forEach((newMsg, i) => {
        expect(newMsg).toMatchObject(messages[i]);
      });
    });

    it('can be enabled', () => {
      const { messages, newMessageList } = runMessageProcessing(messagesData, {
        hideDeletedMessages: true,
      });
      expect(newMessageList).toHaveLength(2);
      expect(newMessageList[0]).toMatchObject(messages[0]);
      expect(newMessageList[1]).toMatchObject(messages[2]);
    });
  });

  describe('date separator', () => {
    it('is disabled by default', () => {
      const { messages, newMessageList } = runMessageProcessing(msgCreationDatesSameDay);
      dateSeparatorInsertedAt([], messages, newMessageList);
    });

    describe('inserted at the beginning only', () => {
      it('all messages were created on the same day', () => {
        const { messages, newMessageList } = runMessageProcessing(
          msgCreationDatesSameDay,
          enableDateSeparatorParams,
        );
        dateSeparatorInsertedAt(['start'], messages, newMessageList);
      });
    });

    describe('inserted at the beginning & between the messages', () => {
      const expectedWhere = ['start', 'mid'];
      it('messages were created on a different day', () => {
        const { messages, newMessageList } = runMessageProcessing(
          msgCreationDatesDifferentDay,
          enableDateSeparatorParams,
        );
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('first message contains invalid date', () => {
        const { messages, newMessageList } = runMessageProcessing(
          msgCreationDatesFirstInvalid,
          enableDateSeparatorParams,
        );
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('second message contains invalid date', () => {
        const { messages, newMessageList } = runMessageProcessing(
          msgCreationDatesSecondInvalid,
          enableDateSeparatorParams,
        );
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });
    });

    describe('replaces deleted messages', () => {
      const date1 = new Date('1970-01-01');
      const date2 = new Date('1970-01-02');
      const date3 = new Date('1970-01-03');

      const deletedMessagesReplacedCorrectly = (messages, newMessageList) => {
        expect(newMessageList[0]).toMatchObject(makeDateSeparator(messages[0]));
        expect(newMessageList[1]).toMatchObject(messages[0]);
        expect(newMessageList[2]).toMatchObject(makeDateSeparator(messages[3]));
        expect(newMessageList[3]).toMatchObject(messages[3]);
      };
      it('if deleted messages hidden are created on later date than the preceding messages', () => {
        const messagesData = [
          { created_at: date1, updated_at: date1 },
          { created_at: date2, type: 'deleted', updated_at: date2 },
          { created_at: date3, type: 'deleted', updated_at: date3 },
          { created_at: date3, updated_at: date3 },
        ];
        const { messages, newMessageList } = runMessageProcessing(messagesData, {
          hideDeletedMessages: true,
          ...enableDateSeparatorParams,
        });
        deletedMessagesReplacedCorrectly(messages, newMessageList);
      });
      it('if deleted messages hidden are created on later date than the following messages', () => {
        const messagesData = [
          { created_at: date3, updated_at: date3 },
          { created_at: date3, type: 'deleted', updated_at: date3 },
          { created_at: date2, type: 'deleted', updated_at: date2 },
          { created_at: date1, updated_at: date1 },
        ];
        const { messages, newMessageList } = runMessageProcessing(messagesData, {
          hideDeletedMessages: true,
          ...enableDateSeparatorParams,
        });
        deletedMessagesReplacedCorrectly(messages, newMessageList);
      });
      it('if deleted messages hidden are created on earlier date than the following messages', () => {
        const messagesData = [
          { created_at: date1, updated_at: date1 },
          { created_at: date1, type: 'deleted', updated_at: date1 },
          { created_at: date2, type: 'deleted', updated_at: date2 },
          { created_at: date3, updated_at: date3 },
        ];
        const { messages, newMessageList } = runMessageProcessing(messagesData, {
          hideDeletedMessages: true,
          ...enableDateSeparatorParams,
        });
        deletedMessagesReplacedCorrectly(messages, newMessageList);
      });
      it('if deleted messages hidden are created on earlier date than the preceding messages', () => {
        const messagesData = [
          { created_at: date3, updated_at: date3 },
          { created_at: date2, type: 'deleted', updated_at: date2 },
          { created_at: date1, type: 'deleted', updated_at: date1 },
          { created_at: date1, updated_at: date1 },
        ];
        const { messages, newMessageList } = runMessageProcessing(messagesData, {
          hideDeletedMessages: true,
          ...enableDateSeparatorParams,
        });
        deletedMessagesReplacedCorrectly(messages, newMessageList);
      });

      it('not if deleted messages are not hidden and are created on later date than the preceding messages', () => {
        const messagesData = [
          { created_at: date1, updated_at: date1 },
          { created_at: date2, type: 'deleted', updated_at: date2 },
          { created_at: date3, type: 'deleted', updated_at: date3 },
          { created_at: date3, updated_at: date3 },
        ];
        const { messages, newMessageList } = runMessageProcessing(
          messagesData,
          enableDateSeparatorParams,
        );

        expect(newMessageList[0]).toMatchObject(makeDateSeparator(messages[0]));
        expect(newMessageList[1]).toMatchObject(messages[0]);
        expect(newMessageList[2]).toMatchObject(makeDateSeparator(messages[1]));
        expect(newMessageList[3]).toMatchObject(messages[1]);
        expect(newMessageList[4]).toMatchObject(makeDateSeparator(messages[2]));
        expect(newMessageList[5]).toMatchObject(messages[2]);
        expect(newMessageList[6]).toMatchObject(messages[3]);
      });
      it('not if deleted messages are not hidden and are created on later date than the following messages', () => {
        const messagesData = [
          { created_at: date3, updated_at: date3 },
          { created_at: date3, type: 'deleted', updated_at: date3 },
          { created_at: date2, type: 'deleted', updated_at: date2 },
          { created_at: date1, updated_at: date1 },
        ];
        const { messages, newMessageList } = runMessageProcessing(
          messagesData,
          enableDateSeparatorParams,
        );

        expect(newMessageList[0]).toMatchObject(makeDateSeparator(messages[0]));
        expect(newMessageList[1]).toMatchObject(messages[0]);
        expect(newMessageList[2]).toMatchObject(messages[1]);
        expect(newMessageList[3]).toMatchObject(makeDateSeparator(messages[2]));
        expect(newMessageList[4]).toMatchObject(messages[2]);
        expect(newMessageList[5]).toMatchObject(makeDateSeparator(messages[3]));
        expect(newMessageList[6]).toMatchObject(messages[3]);
      });
      it('not if deleted messages are not hidden and are created on earlier date than the following messages', () => {
        const messagesData = [
          { created_at: date1, updated_at: date1 },
          { created_at: date1, type: 'deleted', updated_at: date1 },
          { created_at: date2, type: 'deleted', updated_at: date2 },
          { created_at: date3, updated_at: date3 },
        ];
        const { messages, newMessageList } = runMessageProcessing(
          messagesData,
          enableDateSeparatorParams,
        );

        expect(newMessageList[0]).toMatchObject(makeDateSeparator(messages[0]));
        expect(newMessageList[1]).toMatchObject(messages[0]);
        expect(newMessageList[2]).toMatchObject(messages[1]);
        expect(newMessageList[3]).toMatchObject(makeDateSeparator(messages[2]));
        expect(newMessageList[4]).toMatchObject(messages[2]);
        expect(newMessageList[5]).toMatchObject(makeDateSeparator(messages[3]));
        expect(newMessageList[6]).toMatchObject(messages[3]);
      });
      it('not if deleted messages are not hidden and are created on earlier date than the preceding messages', () => {
        const messagesData = [
          { created_at: date3, updated_at: date3 },
          { created_at: date2, type: 'deleted', updated_at: date2 },
          { created_at: date1, type: 'deleted', updated_at: date1 },
          { created_at: date1, updated_at: date1 },
        ];
        const { messages, newMessageList } = runMessageProcessing(
          messagesData,
          enableDateSeparatorParams,
        );

        expect(newMessageList[0]).toMatchObject(makeDateSeparator(messages[0]));
        expect(newMessageList[1]).toMatchObject(messages[0]);
        expect(newMessageList[2]).toMatchObject(makeDateSeparator(messages[1]));
        expect(newMessageList[3]).toMatchObject(messages[1]);
        expect(newMessageList[4]).toMatchObject(makeDateSeparator(messages[2]));
        expect(newMessageList[5]).toMatchObject(messages[2]);
        expect(newMessageList[6]).toMatchObject(messages[3]);
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

      it('showed from others', () => {
        const { messages, newMessageList } = runMessageProcessing(incomingNewMessages, {
          lastRead,
          ...enableDateSeparatorParams,
        });
        dateSeparatorInsertedAt(
          expectedWhere,
          messages,
          newMessageList,
          shouldExpectUnreadSeparator,
        );
      });

      it('not showed from others if read', () => {
        const { messages, newMessageList } = runMessageProcessing(incomingOldMessages, {
          lastRead,
          ...enableDateSeparatorParams,
        });
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('not showed from others if hideNewMessageSeparator enabled', () => {
        const { messages, newMessageList } = runMessageProcessing(incomingNewMessages, {
          hideNewMessageSeparator: true,
          lastRead,
          ...enableDateSeparatorParams,
        });
        dateSeparatorInsertedAt(expectedWhere, messages, newMessageList);
      });

      it('not from me', () => {
        const { messages, newMessageList } = runMessageProcessing(myNewMessages, {
          lastRead,
          ...enableDateSeparatorParams,
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

  it('generates custom messages with unique id', () => {
    const { newMessageList } = runMessageProcessing(
      msgCreationDatesDifferentDay,
      enableDateSeparatorParams,
    );
    const customMessages = newMessageList.filter((m) =>
      Object.values(CUSTOM_MESSAGE_TYPE).includes(m.customType),
    );
    const customMsgIDs = customMessages.map((m) => m.id);
    expect(customMessages).toHaveLength(new Set(customMsgIDs).size);
  });
});
