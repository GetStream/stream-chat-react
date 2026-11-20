import { fromPartial } from '@total-typescript/shoehorn';
import { ScheduledMessageErrorReason, StreamAPIError } from 'stream-chat';
import type { Attachment, UserResponse } from 'stream-chat';

import { isScheduledMessageError } from '../scheduledMessageErrors';
import {
  toComposedScheduledMessagePreview,
  toStoredScheduledMessagePreview,
} from '../scheduledMessagePreview';
import {
  convertDateToTimestamp,
  generateScheduledMessage,
} from '../../../../mock-builders';

const createApiError = (code: number) =>
  new StreamAPIError('request failed', {
    code,
    response: fromPartial<NonNullable<StreamAPIError['response']>>({
      data: { code },
      status: 400,
    }),
    status: 400,
  });

describe('isScheduledMessageError', () => {
  it('matches an API error with the given reason', () => {
    expect(
      isScheduledMessageError(createApiError(119), ScheduledMessageErrorReason.IdTaken),
    ).toBe(true);
  });

  it.each([
    ['another reason', createApiError(118)],
    ['a network error', new Error('Network Error')],
    ['a thrown string', 'failed'],
  ])('does not match %s', (_, error) => {
    expect(isScheduledMessageError(error, ScheduledMessageErrorReason.IdTaken)).toBe(
      false,
    );
  });
});

describe('toComposedScheduledMessagePreview', () => {
  it('builds a local message from the composition dated now', () => {
    const now = new Date(2026, 9, 28, 10, 30);
    const timestamp = convertDateToTimestamp(now);
    const user = fromPartial<UserResponse>({ id: 'user-id' });
    const attachments: Attachment[] = [{ custom: {}, type: 'image' }];

    const previewMessage = toComposedScheduledMessagePreview(
      {
        attachments,
        cid: 'messaging:general',
        id: 'message-id',
        text: 'Launch moved to Monday',
      },
      user,
      now,
    );

    expect(previewMessage).toMatchObject({
      attachments,
      cid: 'messaging:general',
      created_at: timestamp,
      id: 'message-id',
      text: 'Launch moved to Monday',
      type: 'regular',
      updated_at: timestamp,
      user,
    });
  });
});

describe('toStoredScheduledMessagePreview', () => {
  it('builds a local message updated at the scheduled time', () => {
    const scheduledAt = convertDateToTimestamp(new Date(2026, 9, 29, 9, 0));
    const attachments: Attachment[] = [{ custom: {}, type: 'image' }];
    const scheduledMessage = generateScheduledMessage({
      id: 'scheduled-id',
      message: { attachments, custom: {}, text: 'Launch moved to Monday' },
      scheduled_at: scheduledAt,
    });

    const previewMessage = toStoredScheduledMessagePreview(scheduledMessage);

    expect(previewMessage).toMatchObject({
      attachments,
      cid: scheduledMessage.cid,
      created_at: scheduledMessage.created_at,
      id: 'scheduled-id',
      text: 'Launch moved to Monday',
      updated_at: scheduledAt,
    });
  });

  it('uses an empty attachment list when the message has none', () => {
    const scheduledMessage = generateScheduledMessage({
      message: { custom: {}, text: 'Hi' },
    });

    expect(toStoredScheduledMessagePreview(scheduledMessage).attachments).toEqual([]);
  });
});
