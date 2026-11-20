import { generateScheduledMessage } from '../../../../mock-builders';
import { getScopedScheduledMessages } from '../scheduledMessageScope';

const cid = 'messaging:general';

const channelMessage = generateScheduledMessage({ cid });
const threadReply = generateScheduledMessage({
  cid,
  message: { custom: {}, parent_id: 'parent-1', text: 'reply' },
});
const otherThreadReply = generateScheduledMessage({
  cid,
  message: { custom: {}, parent_id: 'parent-2', text: 'other reply' },
});

const scheduledMessages = [channelMessage, threadReply, otherThreadReply];

describe('getScopedScheduledMessages', () => {
  it('keeps only the replies of the thread when a parent id is given', () => {
    expect(
      getScopedScheduledMessages(scheduledMessages, { cid, parentId: 'parent-1' }),
    ).toEqual([threadReply]);
  });

  it('leaves out thread replies for a channel', () => {
    expect(getScopedScheduledMessages(scheduledMessages, { cid })).toEqual([
      channelMessage,
    ]);
  });

  it('keeps every scheduled message without a scope', () => {
    expect(getScopedScheduledMessages(scheduledMessages, {})).toBe(scheduledMessages);
  });
});
