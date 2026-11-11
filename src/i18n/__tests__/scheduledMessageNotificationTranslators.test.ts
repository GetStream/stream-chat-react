import { fromPartial } from '@total-typescript/shoehorn';
import type { TFunction } from 'i18next';
import { ErrorFromResponse, ScheduledMessageBlockReason } from 'stream-chat';
import type { Notification } from 'stream-chat';

import {
  translateScheduledMessageActionFailed,
  translateScheduledMessageBlocked,
  translateScheduledMessageCompositionEnded,
  translateScheduledMessageCreateFailed,
  translateScheduledMessageSendFailed,
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

const translateAction = (type: string, originalError?: Error) =>
  translateScheduledMessageActionFailed({
    key: '',
    options: {
      notification: fromPartial<Notification>({ originalError, type }),
    },
    t,
    value: '',
  });

describe('translateScheduledMessageActionFailed', () => {
  it('reports a message the server no longer has as already sent', () => {
    expect(
      translateAction('api:scheduled-message:send-now:failed', createApiError(16, 404)),
    ).toBe('Already sent');
  });

  it.each([
    [121, 'scheduled_message_sending', 'This message is being sent'],
    [122, 'scheduled_message_conflict', 'Updated elsewhere. Try again'],
    [120, 'scheduled_message_not_editable', "Failed messages can't be edited"],
    [115, 'scheduled_at_too_soon', 'Choose a later time'],
    [116, 'scheduled_at_too_far', 'Choose an earlier time'],
  ])('translates error code %s (%s)', (code, reason, expected) => {
    expect(
      translateAction(
        'api:scheduled-message:update:failed',
        createApiError(code, 400, reason),
      ),
    ).toBe(expected);
  });

  it.each([
    [
      'api:scheduled-message:update:failed',
      "Couldn't update the scheduled message. Try again",
    ],
    [
      'api:scheduled-message:reschedule:failed',
      "Couldn't reschedule the message. Try again",
    ],
    ['api:scheduled-message:send-now:failed', "Couldn't send the message. Try again"],
    [
      'api:scheduled-message:delete:failed',
      "Couldn't delete the scheduled message. Try again",
    ],
  ])('falls back to the copy of %s', (type, expected) => {
    expect(translateAction(type, new Error('network'))).toBe(expected);
  });
});

const interpolatingT = ((key: string, options?: { reason?: string }) =>
  options?.reason ? key.replace('{{ reason }}', options.reason) : key) as TFunction;

const translateSendFailed = (reason?: string) =>
  translateScheduledMessageSendFailed({
    key: '',
    options: {
      notification: fromPartial<Notification>({
        metadata: { reason },
        type: 'api:scheduled-message:send:failed',
      }),
    },
    t: interpolatingT,
    value: '',
  });

describe('translateScheduledMessageSendFailed', () => {
  it('names the failure reason', () => {
    expect(translateSendFailed('channel_frozen')).toBe(
      'Scheduled message not sent: This channel is frozen',
    );
  });

  it('uses the generic reason for an unknown one', () => {
    expect(translateSendFailed('something_new')).toBe(
      "Scheduled message not sent: Couldn't send. Try again",
    );
  });

  it('leaves out a reason that is not shown to users', () => {
    expect(translateSendFailed('user_deleted')).toBe('Scheduled message not sent');
  });
});

describe('translateScheduledMessageCompositionEnded', () => {
  const translateEnded = (reason?: string) =>
    translateScheduledMessageCompositionEnded({
      key: '',
      options: {
        notification: fromPartial<Notification>({
          metadata: { reason },
          type: 'validation:scheduled-message:composition:ended',
        }),
      },
      t,
      value: '',
    });

  it.each([
    ['sent', 'This message was already sent'],
    ['deleted', 'This scheduled message was deleted'],
    ['failed', 'This scheduled message failed to send'],
    [undefined, 'This scheduled message can no longer be edited'],
  ])('explains why the edit ended (%s)', (reason, expected) => {
    expect(translateEnded(reason)).toBe(expected);
  });

  it('is registered for the composition-ended warning', () => {
    expect(
      translatorsByNotificationType['validation:scheduled-message:composition:ended'],
    ).toBe(translateScheduledMessageCompositionEnded);
  });
});

describe('scheduled message notification types', () => {
  it('registers the send failure translator', () => {
    expect(translatorsByNotificationType['api:scheduled-message:send:failed']).toBe(
      translateScheduledMessageSendFailed,
    );
  });

  it.each([
    'api:scheduled-message:update:failed',
    'api:scheduled-message:reschedule:failed',
    'api:scheduled-message:send-now:failed',
    'api:scheduled-message:delete:failed',
  ])('registers the action failure translator for %s', (type) => {
    expect(translatorsByNotificationType[type]).toBe(
      translateScheduledMessageActionFailed,
    );
  });

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
