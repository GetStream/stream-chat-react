import { fromPartial } from '@total-typescript/shoehorn';
import { ErrorFromResponse, ScheduledMessageErrorReason } from 'stream-chat';
import type { LocalAttachment } from 'stream-chat';

import { isScheduledMessageError } from '../scheduledMessageErrors';
import {
  toScheduledMessagePreview,
  toStoredScheduledMessagePreview,
} from '../scheduledMessagePreview';
import { generateScheduledMessage } from '../../../../mock-builders';

const createApiError = (code: number) =>
  new ErrorFromResponse('request failed', {
    code,
    response: fromPartial({ data: { code }, status: 400 }),
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

describe('toScheduledMessagePreview', () => {
  it('builds a pending local message from the composition', () => {
    const now = new Date(2026, 9, 28, 10, 30);
    const attachments = [fromPartial<LocalAttachment>({ type: 'image' })];

    const previewMessage = toScheduledMessagePreview(
      { attachments, id: 'message-id', text: 'Launch moved to Monday' },
      now,
    );

    expect(previewMessage).toEqual({
      attachments,
      created_at: now,
      deleted_at: null,
      id: 'message-id',
      pinned_at: null,
      status: 'pending',
      text: 'Launch moved to Monday',
      type: 'regular',
      updated_at: now,
    });
  });
});

describe('toStoredScheduledMessagePreview', () => {
  it('builds a pending local message dated at the scheduled time', () => {
    const scheduledAt = new Date(2026, 9, 29, 9, 0);
    const attachments = [{ type: 'image' }];
    const scheduledMessage = generateScheduledMessage({
      id: 'scheduled-id',
      message: { attachments, text: 'Launch moved to Monday' },
      scheduled_at: scheduledAt.toISOString(),
    });

    const previewMessage = toStoredScheduledMessagePreview(scheduledMessage);

    expect(previewMessage).toMatchObject({
      attachments,
      created_at: scheduledAt,
      id: 'scheduled-id',
      status: 'pending',
      text: 'Launch moved to Monday',
    });
  });

  it('uses an empty attachment list when the message has none', () => {
    const scheduledMessage = generateScheduledMessage({ message: { text: 'Hi' } });

    expect(toStoredScheduledMessagePreview(scheduledMessage).attachments).toEqual([]);
  });
});
