import { fromPartial } from '@total-typescript/shoehorn';
import { StreamAPIError } from 'stream-chat';
import type { Notification } from 'stream-chat';

import {
  translateScheduledMessageCompositionEnded,
  translateScheduledMessageRequestFailed,
} from '../TranslationBuilder/notifications/translators';
import { translatorsByNotificationType } from '../TranslationBuilder/notifications/translatorsByNotificationType';
import { mockT } from '../../mock-builders';

const t = mockT;

const createApiError = (code: number, status = 400, reason?: string) =>
  new StreamAPIError('request failed', {
    code,
    response: fromPartial<NonNullable<StreamAPIError['response']>>({
      data: { code, exception_fields: reason ? { reason } : {} },
      status,
    }),
    status,
  });

const translate = (originalError?: Error) =>
  translateScheduledMessageRequestFailed({
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

describe('translateScheduledMessageRequestFailed', () => {
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
  translatorsByNotificationType['validation:scheduled-message:blocked']({
    key: '',
    options: {
      notification: fromPartial<Notification>({
        metadata: reason ? { reason } : undefined,
        type: 'validation:scheduled-message:blocked',
      }),
    },
    t,
    value: '',
  });

describe('the scheduled message blocked notification', () => {
  // the schedule button is hidden whenever a block applies, so one line covers the race
  it.each(['command', 'poll', 'shared_location', undefined])(
    'reads the same for any reason (%s)',
    (reason) => {
      expect(translateBlocked(reason)).toBe("This message can't be scheduled");
    },
  );
});

const translateAction = (type: string, originalError?: Error) =>
  translateScheduledMessageRequestFailed({
    key: '',
    options: {
      notification: fromPartial<Notification>({ originalError, type }),
    },
    t,
    value: '',
  });

describe('translateScheduledMessageRequestFailed', () => {
  it('reports a message the server no longer has as already sent', () => {
    expect(
      translateAction('api:scheduled-message:update:failed', createApiError(16, 404)),
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

  it('falls back to the generic copy of an edit', () => {
    expect(
      translateAction('api:scheduled-message:update:failed', new Error('network')),
    ).toBe("Couldn't update the scheduled message. Try again");
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
    ['deleted', 'This scheduled message can no longer be edited'],
    ['failed', 'This scheduled message can no longer be edited'],
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
  // the React notifications carry their own translated message, the error's specific copy included
  it.each([
    'api:scheduled-message:send:failed',
    'api:scheduled-message:reschedule:failed',
    'api:scheduled-message:send-now:failed',
    'api:scheduled-message:delete:failed',
  ])('registers no translator for %s', (type) => {
    expect(translatorsByNotificationType[type]).toBeUndefined();
  });

  it('registers translators for the composer notifications', () => {
    expect(translatorsByNotificationType['api:scheduled-message:create:failed']).toBe(
      translateScheduledMessageRequestFailed,
    );
    expect(translatorsByNotificationType['api:scheduled-message:update:failed']).toBe(
      translateScheduledMessageRequestFailed,
    );
    expect(translatorsByNotificationType).not.toHaveProperty(
      'validation:scheduled-message:command',
    );
  });
});
