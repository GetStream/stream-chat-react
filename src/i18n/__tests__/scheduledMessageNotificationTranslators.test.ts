import { fromPartial } from '@total-typescript/shoehorn';
import type { TFunction } from 'i18next';
import { ErrorFromResponse, ScheduledMessageBlockReason } from 'stream-chat';
import type { Notification } from 'stream-chat';

import {
  translateScheduledMessageBlocked,
  translateScheduledMessageCreateFailed,
} from '../TranslationBuilder/notifications/translators';
import { translatorsByNotificationType } from '../TranslationBuilder/notifications/translatorsByNotificationType';

const t = ((key: string) => key) as TFunction;

const createApiError = (code: number | null, status = 400, reason?: string) =>
  new ErrorFromResponse('request failed', {
    code,
    response: fromPartial({
      data: { code, exception_fields: reason ? { reason } : {} },
      status,
    }),
    status,
  });

const translate = (originalError?: Error) =>
  translateScheduledMessageCreateFailed({
    key: '',
    options: {
      notification: fromPartial<Notification>({
        message: 'Failed to schedule the message',
        originalError,
        type: 'api:scheduled-message:create:failed',
      }),
    },
    t,
    value: '',
  });

describe('translateScheduledMessageCreateFailed', () => {
  it.each([
    [114, 'Scheduled messages are turned off'],
    [115, 'Choose a later time'],
    [116, 'Choose an earlier time'],
    [117, "You've reached the limit of scheduled messages in this channel"],
    [118, "You've reached the limit of scheduled messages"],
  ])('translates error code %s', (code, expected) => {
    expect(translate(createApiError(code))).toBe(expected);
  });

  it('prefers the reason from exception_fields', () => {
    expect(translate(createApiError(4, 400, 'scheduled_limit_user'))).toBe(
      "You've reached the limit of scheduled messages",
    );
  });

  it('translates a missing permission', () => {
    expect(translate(createApiError(17, 403))).toBe("You can't schedule messages here");
  });

  it.each([
    ['an id conflict', createApiError(119)],
    ['an unknown API error', createApiError(4)],
    ['a network error', new Error('Network Error')],
    ['a missing error', undefined],
  ])('falls back to the generic copy for %s', (_, error) => {
    expect(translate(error)).toBe("Couldn't schedule message. Try again");
  });
});

const translateBlocked = (reason?: string) =>
  translateScheduledMessageBlocked({
    key: '',
    options: {
      notification: fromPartial<Notification>({
        message: 'This message cannot be scheduled',
        metadata: reason ? { reason } : undefined,
        type: 'validation:scheduled-message:blocked',
      }),
    },
    t,
    value: '',
  });

describe('translateScheduledMessageBlocked', () => {
  it.each([
    [ScheduledMessageBlockReason.Command, "Slash commands can't be scheduled"],
    [ScheduledMessageBlockReason.Poll, "Polls can't be scheduled"],
    [ScheduledMessageBlockReason.SharedLocation, "Locations can't be scheduled"],
  ])('translates the %s reason', (reason, expected) => {
    expect(translateBlocked(reason)).toBe(expected);
  });

  it('falls back to the generic copy without a known reason', () => {
    expect(translateBlocked()).toBe("This message can't be scheduled");
    expect(translateBlocked('unknown')).toBe("This message can't be scheduled");
  });
});

describe('scheduled message notification types', () => {
  it('registers translators for the composer notifications', () => {
    expect(translatorsByNotificationType['api:scheduled-message:create:failed']).toBe(
      translateScheduledMessageCreateFailed,
    );
    expect(translatorsByNotificationType['validation:scheduled-message:blocked']).toBe(
      translateScheduledMessageBlocked,
    );
    expect(translatorsByNotificationType).not.toHaveProperty(
      'validation:scheduled-message:command',
    );
  });
});
