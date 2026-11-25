import { fromPartial } from '@total-typescript/shoehorn';
import { SCHEDULED_MESSAGE_FAILURE_REASON, StreamAPIError } from 'stream-chat';

import {
  getScheduledMessageErrorKey,
  SCHEDULED_MESSAGE_ERROR_TRANSLATIONS,
  SCHEDULED_MESSAGE_FAILURE_REASON_TRANSLATIONS,
} from '../translations';

const t = ((_key: string, defaultValue: string) => defaultValue) as never;

const apiError = ({ code, status }: { code?: number; status: number }) =>
  new StreamAPIError('request failed', {
    code,
    response: fromPartial<NonNullable<StreamAPIError['response']>>({
      data: { code },
      status,
    }),
    status,
  });

describe('scheduled message translations', () => {
  it('explains each failure reason, except a deleted user', () => {
    expect(
      SCHEDULED_MESSAGE_FAILURE_REASON_TRANSLATIONS[
        SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen
      ]?.(t),
    ).toBe('This channel is frozen');
    expect(
      SCHEDULED_MESSAGE_FAILURE_REASON_TRANSLATIONS[
        SCHEDULED_MESSAGE_FAILURE_REASON.PendingNotSupported
      ]?.(t),
    ).toBe('This channel now needs approval. Schedule it again');
    expect(
      SCHEDULED_MESSAGE_FAILURE_REASON_TRANSLATIONS[
        SCHEDULED_MESSAGE_FAILURE_REASON.UserDeleted
      ],
    ).toBeNull();
  });

  it('keys a request error by its reason, or by a not-found or forbidden status', () => {
    expect(getScheduledMessageErrorKey(apiError({ code: 117, status: 400 }))).toBe(
      'scheduled_limit_channel',
    );
    expect(getScheduledMessageErrorKey(apiError({ status: 404 }))).toBe(404);
    expect(getScheduledMessageErrorKey(apiError({ status: 403 }))).toBe(403);
    expect(getScheduledMessageErrorKey(apiError({ status: 500 }))).toBeUndefined();
    expect(getScheduledMessageErrorKey(new Error('offline'))).toBeUndefined();
  });

  it('explains the request errors it has copy for', () => {
    expect(SCHEDULED_MESSAGE_ERROR_TRANSLATIONS.scheduled_limit_channel?.(t)).toBe(
      "You've reached the limit of scheduled messages in this channel",
    );
    expect(SCHEDULED_MESSAGE_ERROR_TRANSLATIONS[404]?.(t)).toBe('Already sent');
    expect(
      SCHEDULED_MESSAGE_ERROR_TRANSLATIONS.scheduled_message_id_taken,
    ).toBeUndefined();
  });
});
