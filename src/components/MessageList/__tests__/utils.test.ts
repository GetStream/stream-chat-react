import { fromPartial } from '@total-typescript/shoehorn';
import type { LocalMessage } from 'stream-chat';

import {
  generateFileAttachment,
  generateMessage,
  generateUser,
} from '../../../mock-builders';

import {
  getGroupStyles,
  insertIntro,
  isDateSeparatorMessage,
  makeDateMessageId,
  processMessages,
} from '../utils';
import { CUSTOM_MESSAGE_TYPE } from '../../../constants/messageTypes';
import { convertTimestampToDate, msToNs } from 'stream-chat';
import { convertDateToTimestamp } from '../../../mock-builders';

const mockedNanoId = 'V1StGXR8_Z5jdHi6B-myT';
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => mockedNanoId),
}));

const myUserId = 'myUserId';
const otherUserId = 'otherUserId';
const enableDateSeparatorParams = { enableDateSeparator: true };

const msgCreationDatesSameDay = [
  {
    created_at: convertDateToTimestamp(new Date('1970-01-01')),
    updated_at: convertDateToTimestamp(new Date('1970-01-01')),
  },
  {
    created_at: convertDateToTimestamp(new Date('1970-01-01')),
    updated_at: convertDateToTimestamp(new Date('1970-01-01')),
  },
];
const msgCreationDatesDifferentDay = [
  {
    created_at: convertDateToTimestamp(new Date('1970-01-01')),
    updated_at: convertDateToTimestamp(new Date('1970-01-01')),
  },
  {
    created_at: convertDateToTimestamp(new Date('1970-01-02')),
    updated_at: convertDateToTimestamp(new Date('1970-01-02')),
  },
];
const msgCreationDatesFirstInvalid = [
  {
    created_at: convertDateToTimestamp(new Date('1970-01-00')),
    updated_at: convertDateToTimestamp(new Date('1970-01-00')),
  },
  {
    created_at: convertDateToTimestamp(new Date('1970-01-01')),
    updated_at: convertDateToTimestamp(new Date('1970-01-01')),
  },
];
const msgCreationDatesSecondInvalid = [
  {
    created_at: convertDateToTimestamp(new Date('1970-01-31')),
    updated_at: convertDateToTimestamp(new Date('1970-01-31')),
  },
  {
    created_at: convertDateToTimestamp(new Date('1970-02-00')),
    updated_at: convertDateToTimestamp(new Date('1970-02-00')),
  },
];

const runMessageProcessing = (msgData, processMsgParams = {}) => {
  const messages = msgData.map((msg) => generateMessage(msg));
  return {
    messages,
    newMessageList: processMessages({ messages, userId: myUserId, ...processMsgParams }),
  };
};

// The separator is a view-model carrying a `Date`, built from the message's wire timestamp — so the
// expectation has to go through the same conversion the list does.
const makeDateSeparator = (message) => ({
  customType: 'message.date',
  date: convertTimestampToDate(message.created_at),
  id: makeDateMessageId(convertTimestampToDate(message.created_at)),
});

const dateSeparatorInsertedAt = (
  expectedWhere: any,
  messages: any,
  newMessageList: any,
  unread?: any,
) => {
  if (!expectedWhere) {
    throw new Error('Missing "where"');
  }

  expect(newMessageList).toHaveLength(expectedWhere.length + messages.length);

  const startDateMsg = makeDateSeparator(messages[0]);
  const midDateMsg = makeDateSeparator(messages[1]);

  if (unread) {
    startDateMsg['unread'] = unread;
    midDateMsg['unread'] = unread;
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
    });

    // These fixtures hold an `Invalid Date`, which the wire normalizer turns into `NaN`. No
    // separator can be built for such a message; the valid sibling still gets one.
    describe('skipped for a message whose timestamp is unusable', () => {
      it('omits the separator for an invalid first message, keeping the second', () => {
        const { messages, newMessageList } = runMessageProcessing(
          msgCreationDatesFirstInvalid,
          enableDateSeparatorParams,
        );

        expect(newMessageList).toHaveLength(messages.length + 1);
        expect(isDateSeparatorMessage(newMessageList[0])).toBe(false);
        expect(newMessageList[0]).toMatchObject(messages[0]);
        expect(isDateSeparatorMessage(newMessageList[1])).toBe(true);
        expect(newMessageList[1]).toMatchObject(makeDateSeparator(messages[1]));
        expect(newMessageList[2]).toMatchObject(messages[1]);
      });

      it('omits the separator for an invalid second message, keeping the first', () => {
        const { messages, newMessageList } = runMessageProcessing(
          msgCreationDatesSecondInvalid,
          enableDateSeparatorParams,
        );

        expect(newMessageList).toHaveLength(messages.length + 1);
        expect(isDateSeparatorMessage(newMessageList[0])).toBe(true);
        expect(newMessageList[0]).toMatchObject(makeDateSeparator(messages[0]));
        expect(newMessageList[1]).toMatchObject(messages[0]);
        expect(isDateSeparatorMessage(newMessageList[2])).toBe(false);
        expect(newMessageList[2]).toMatchObject(messages[1]);
      });

      it('never emits a separator object that is not a valid separator', () => {
        for (const fixture of [
          msgCreationDatesFirstInvalid,
          msgCreationDatesSecondInvalid,
        ]) {
          const { newMessageList } = runMessageProcessing(
            fixture,
            enableDateSeparatorParams,
          );
          for (const entry of newMessageList) {
            if ((entry as { customType?: string }).customType === 'message.date') {
              expect(isDateSeparatorMessage(entry)).toBe(true);
            }
          }
        }
      });
    });

    describe('replaces deleted messages', () => {
      const date1 = convertDateToTimestamp('1970-01-01');
      const date2 = convertDateToTimestamp('1970-01-02');
      const date3 = convertDateToTimestamp('1970-01-03');

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
      const oldMsg = {
        created_at: convertDateToTimestamp(new Date('1970-01-01')),
        updated_at: convertDateToTimestamp(new Date('1970-01-01')),
      };
      const unreadMsg = {
        created_at: convertDateToTimestamp(new Date('9999-12-31')),
        updated_at: convertDateToTimestamp(new Date('9999-12-31')),
      };
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
    const setGiphyPreviewMessageMock = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('is set if provided with preview message setter and messages contain ephemeral giphy message', () => {
      const messagesData = [{}, { command: 'giphy', type: 'ephemeral' }, {}];
      runMessageProcessing(messagesData, {
        setGiphyPreviewMessage: setGiphyPreviewMessageMock,
      });
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
      runMessageProcessing(messagesData, {
        setGiphyPreviewMessage: setGiphyPreviewMessageMock,
      });
      expect(setGiphyPreviewMessageMock).toHaveBeenLastCalledWith(undefined);
    });
    it('is no set to undefined if messages do not contain message of command giphy', () => {
      const messagesData = [{}, { type: 'ephemeral' }, {}];
      runMessageProcessing(messagesData, {
        setGiphyPreviewMessage: setGiphyPreviewMessageMock,
      });
      expect(setGiphyPreviewMessageMock).toHaveBeenLastCalledWith(undefined);
    });
  });

  it('generates custom messages with unique id', () => {
    const { newMessageList } = runMessageProcessing(
      msgCreationDatesDifferentDay,
      enableDateSeparatorParams,
    );
    const customMessages = newMessageList.filter((m: any) =>
      Object.values(CUSTOM_MESSAGE_TYPE).includes(m.customType),
    );
    const customMsgIDs = customMessages.map((m) => m.id);
    expect(customMessages).toHaveLength(new Set(customMsgIDs).size);
  });

  it('executes reviewProcessedMessage function for each message', () => {
    const msgCount = 5;
    const messages: LocalMessage[] = Array.from({ length: msgCount }, generateMessage);
    const reviewProcessedMessage = vi.fn();
    processMessages({
      messages,
      reviewProcessedMessage,
      userId: myUserId,
    });

    expect(reviewProcessedMessage).toHaveBeenCalledTimes(msgCount);
    messages.forEach((msg, i) => {
      expect(reviewProcessedMessage.mock.calls[i][0].changes[0].id).toBe(msg.id);
    });
  });

  // The other separator assertions in this file use `toMatchObject`, which is a subset match and so
  // pins nothing about the shape. These two do, because the shape is public: `customMessageRenderer`
  // receives the enriched list, and integrators discriminate it on `customType`. In particular there
  // is deliberately no `type` field — a separator is a view-model, not a message.
  describe('the date separator shape', () => {
    const expectedSeparator = (message: LocalMessage) => ({
      customType: CUSTOM_MESSAGE_TYPE.date,
      date: convertTimestampToDate(message.created_at),
      id: makeDateMessageId(convertTimestampToDate(message.created_at)),
    });

    it('carries only customType, date and id for a plain day divider', () => {
      const message = generateMessage({
        created_at: convertDateToTimestamp('2026-01-01'),
        user: { id: myUserId },
      });

      const [separator] = processMessages({
        ...enableDateSeparatorParams,
        messages: [message],
        userId: myUserId,
      });

      expect(separator).toStrictEqual(expectedSeparator(message));
    });

    it('adds only `unread` for the unread separator', () => {
      const message = generateMessage({
        created_at: convertDateToTimestamp('2026-01-01'),
        user: { id: otherUserId },
      });

      const [separator] = processMessages({
        ...enableDateSeparatorParams,
        // The epoch as "nothing read yet", so the message counts as unread.
        lastRead: 0,
        messages: [message],
        userId: myUserId,
      });

      expect(separator).toStrictEqual({ ...expectedSeparator(message), unread: true });
    });
  });
});

describe('getGroupStyles', () => {
  const user = generateUser();
  let message: LocalMessage;
  let previousMessage: LocalMessage;
  let nextMessage: LocalMessage;
  let noGroupByUser: boolean;
  beforeEach(() => {
    message = generateMessage({ created_at: convertDateToTimestamp(new Date(2)), user });
    previousMessage = generateMessage({
      created_at: convertDateToTimestamp(new Date(1)),
      user,
    });
    nextMessage = generateMessage({
      created_at: convertDateToTimestamp(new Date(100)),
      user,
    });
    noGroupByUser = false;
  });

  describe.each([
    ['bottom', 'next'],
    ['top', 'previous'],
  ])('marks a message as %s when %s message', (position) => {
    it('does not exist', () => {
      if (position === 'bottom') {
        nextMessage = undefined;
      }
      if (position === 'top') {
        previousMessage = undefined;
      }
      expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
        position,
      );
    });

    it('is intro message', () => {
      if (position === 'bottom') {
        nextMessage = {
          ...nextMessage,
          customType: CUSTOM_MESSAGE_TYPE.intro,
        } as LocalMessage;
      }
      if (position === 'top') {
        previousMessage = {
          ...previousMessage,
          customType: CUSTOM_MESSAGE_TYPE.intro,
        } as LocalMessage;
      }
      expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
        position,
      );
    });

    it('is date message', () => {
      if (position === 'bottom') {
        nextMessage = {
          ...nextMessage,
          customType: CUSTOM_MESSAGE_TYPE.date,
          date: new Date(),
        } as LocalMessage;
      }
      if (position === 'top') {
        previousMessage = {
          ...previousMessage,
          customType: CUSTOM_MESSAGE_TYPE.date,
          date: new Date(),
        } as LocalMessage;
      }

      expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
        position,
      );
    });

    it('is a system message', () => {
      if (position === 'bottom') {
        nextMessage = { ...nextMessage, type: 'system' };
      }
      if (position === 'top') {
        previousMessage = { ...previousMessage, type: 'system' };
      }
      expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
        position,
      );
    });

    it('is an error message', () => {
      if (position === 'bottom') {
        nextMessage = { ...nextMessage, type: 'error' };
      }
      if (position === 'top') {
        previousMessage = { ...previousMessage, type: 'error' };
      }
      expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
        position,
      );
    });

    it('has attachments', () => {
      if (position === 'bottom') {
        nextMessage = { ...nextMessage, attachments: [generateFileAttachment()] };
      }
      if (position === 'top') {
        previousMessage = { ...previousMessage, attachments: [generateFileAttachment()] };
      }
      expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
        position,
      );
    });

    it('is posted by another user', () => {
      const user = generateUser({ id: 'XX' });
      if (position === 'bottom') {
        nextMessage = { ...nextMessage, user };
      }
      if (position === 'top') {
        previousMessage = { ...previousMessage, user };
      }
      expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
        position,
      );
    });

    // deleted_at no longer affects grouping in v14
    it('is deleted', () => {
      if (position === 'bottom') {
        nextMessage = { ...nextMessage, deleted_at: convertDateToTimestamp(new Date()) };
      }
      if (position === 'top') {
        previousMessage = {
          ...previousMessage,
          deleted_at: convertDateToTimestamp(new Date()),
        };
      }
      // deleted_at on adjacent messages does not break groups anymore
      expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
        'middle',
      );
    });
  });

  it('marks a message as bottom when the message is edited', () => {
    message = {
      ...message,
      message_text_updated_at: convertDateToTimestamp(new Date().toISOString()),
    };
    expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
      'bottom',
    );
  });

  it('marks a message as top when the previous message is edited', () => {
    previousMessage = {
      ...previousMessage,
      message_text_updated_at: convertDateToTimestamp(new Date().toISOString()),
    };
    expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
      'top',
    );
  });

  it('marks a message a top if it has reactions', () => {
    message = {
      ...message,
      reaction_groups: fromPartial<LocalMessage['reaction_groups']>({ X: 'Y' }),
    };
    expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
      'top',
    );
  });

  it('marks a message a bottom if next message has reactions', () => {
    nextMessage = {
      ...nextMessage,
      reaction_groups: fromPartial<LocalMessage['reaction_groups']>({ X: 'Y' }),
    };
    expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
      'bottom',
    );
  });

  it('marks a message as top when next message is created later than maxTimeBetweenGroupedMessages milliseconds', () => {
    const maxTimeBetweenGroupedMessages = 10;
    expect(
      getGroupStyles(
        message,
        previousMessage,
        nextMessage,
        noGroupByUser,
        maxTimeBetweenGroupedMessages,
      ),
    ).toBe('bottom');
  });

  it('marks a message as bottom when next message is created later than maxTimeBetweenGroupedMessages milliseconds', () => {
    const maxTimeBetweenGroupedMessages = 10;
    message = { ...message, created_at: msToNs(12) };
    nextMessage = { ...nextMessage, created_at: msToNs(14) };
    expect(
      getGroupStyles(
        message,
        previousMessage,
        nextMessage,
        noGroupByUser,
        maxTimeBetweenGroupedMessages,
      ),
    ).toBe('top');
  });

  it('marks a message as single when next and previous message is created later than maxTimeBetweenGroupedMessages milliseconds', () => {
    const maxTimeBetweenGroupedMessages = 10;
    message = { ...message, created_at: msToNs(12) };
    expect(
      getGroupStyles(
        message,
        previousMessage,
        nextMessage,
        noGroupByUser,
        maxTimeBetweenGroupedMessages,
      ),
    ).toBe('single');
  });

  it('marks a message as middle when next message is created earlier than maxTimeBetweenGroupedMessages milliseconds', () => {
    const maxTimeBetweenGroupedMessages = 1000;
    expect(
      getGroupStyles(
        message,
        previousMessage,
        nextMessage,
        noGroupByUser,
        maxTimeBetweenGroupedMessages,
      ),
    ).toBe('middle');
  });

  it('marks message as middle if not being top, neither bottom message', () => {
    expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
      'middle',
    );
  });

  // deleted_at on the message itself no longer forces 'single' in v14
  it('marks message as middle even when deleted (deleted_at no longer affects grouping)', () => {
    message = { ...message, deleted_at: convertDateToTimestamp(new Date()) };
    expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
      'middle',
    );
  });

  it('marks message as single if not being top, neither bottom message being error message', () => {
    message = { ...message, type: 'error' };
    expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
      'single',
    );
  });

  // deleted_at no longer forces 'single'; at the bottom position it's just 'bottom'
  it('marks message at the bottom as bottom even when deleted', () => {
    message = { ...message, deleted_at: convertDateToTimestamp(new Date()) };
    nextMessage = undefined;
    expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
      'bottom',
    );
  });

  it('marks message at the bottom as single being error message', () => {
    message = { ...message, type: 'error' };
    nextMessage = undefined;
    expect(getGroupStyles(message, previousMessage, nextMessage, noGroupByUser)).toBe(
      'single',
    );
  });

  // `created_at` is unix nanoseconds, so the epoch is `0` — a legitimate wire value that is falsy.
  // A truthiness guard in front of the time-gap calculation skips the cutoff entirely, leaving
  // messages grouped however far apart they are.
  describe('with a message created at the epoch', () => {
    it('applies the cutoff when the previous message is at the epoch', () => {
      const maxTimeBetweenGroupedMessages = 10;
      previousMessage = { ...previousMessage, created_at: 0 };
      message = { ...message, created_at: msToNs(12) };

      // 12ms apart, so the previous message must not be grouped with this one. A truthiness guard
      // skips the comparison and reports 'bottom' instead.
      expect(
        getGroupStyles(
          message,
          previousMessage,
          nextMessage,
          noGroupByUser,
          maxTimeBetweenGroupedMessages,
        ),
      ).toBe('single');
    });

    it('applies the cutoff when the message itself is at the epoch', () => {
      const maxTimeBetweenGroupedMessages = 10;
      message = { ...message, created_at: 0 };
      nextMessage = { ...nextMessage, created_at: msToNs(12) };

      // The symmetric branch: a truthiness guard reports 'middle' and glues the next message on.
      expect(
        getGroupStyles(
          message,
          previousMessage,
          nextMessage,
          noGroupByUser,
          maxTimeBetweenGroupedMessages,
        ),
      ).toBe('bottom');
    });
  });
});

describe('insertIntro', () => {
  // `headerPosition` is a public prop compared against `message.created_at`, so unix nanoseconds.
  const NS_PER_MS = 1e6;
  const at = (iso: string) => Date.parse(iso) * NS_PER_MS;
  const msg = (iso: string, id: string) =>
    fromPartial<LocalMessage>({ created_at: at(iso), id, status: 'received' });
  const isIntro = (entry: unknown) =>
    (entry as { customType?: string })?.customType === CUSTOM_MESSAGE_TYPE.intro;

  it('puts the intro at the top when no position is given', () => {
    const result = insertIntro([msg('2026-01-02T00:00:00Z', 'a')]);

    expect(isIntro(result[0])).toBe(true);
  });

  it('puts the intro at the top for an empty list', () => {
    expect(isIntro(insertIntro([])[0])).toBe(true);
  });

  it('treats the epoch as a real position rather than "unset"', () => {
    // `0` is falsy, so a truthiness guard would unshift the intro instead.
    const result = insertIntro([msg('2026-01-02T00:00:00Z', 'a')], 0);

    expect(isIntro(result[0])).toBe(false);
  });

  it('places the intro after messages older than the position, in nanoseconds', () => {
    const messages = [
      msg('2026-01-01T00:00:00Z', 'older'),
      msg('2026-01-03T00:00:00Z', 'newer'),
    ];

    const result = insertIntro(messages, at('2026-01-02T00:00:00Z'));

    expect(result.map((m) => (isIntro(m) ? 'intro' : m.id))).toEqual([
      'older',
      'intro',
      'newer',
    ]);
  });

  it('is in nanoseconds, not milliseconds — the unit the migration changed', () => {
    const messages = [
      msg('2026-01-01T00:00:00Z', 'older'),
      msg('2026-01-03T00:00:00Z', 'newer'),
    ];
    // The epoch-millisecond value an integrator would have passed before the migration.
    const asMilliseconds = Date.parse('2026-01-02T00:00:00Z');

    const result = insertIntro([...messages], asMilliseconds);

    expect(result.some(isIntro)).toBe(false);
    expect(insertIntro([...messages], asMilliseconds * NS_PER_MS).some(isIntro)).toBe(
      true,
    );
  });
});
