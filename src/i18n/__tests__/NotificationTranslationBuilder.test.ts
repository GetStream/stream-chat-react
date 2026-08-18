import { NotificationTranslationTopic } from '../TranslationBuilder';
import { defaultNotificationTranslators } from '../TranslationBuilder/notifications/NotificationTranslationTopic';
import { fromPartial } from '@total-typescript/shoehorn';
import type { i18n } from 'i18next';
import type { Notification } from 'stream-chat';

const mockI18Next = fromPartial<i18n>({ use: vi.fn() });
describe('NotificationTranslationTopic', () => {
  it('gets initiated with defaults', () => {
    const builder = new NotificationTranslationTopic({ i18next: mockI18Next });
    expect(builder['i18next']).toEqual(mockI18Next);
    expect(builder['translators'].size).toBe(
      Object.keys(defaultNotificationTranslators).length,
    );
  });

  it('gets initiated with custom translators', () => {
    const translators = {
      test: vi.fn(),
      'validation:attachment:upload:blocked': vi.fn(),
    };
    const builder = new NotificationTranslationTopic({
      i18next: mockI18Next,
      translators,
    });
    expect(builder['translators'].size).toBe(
      Object.keys(defaultNotificationTranslators).length + 2,
    );
    expect(builder['translators'].get('test')).toEqual(translators.test);
    expect(builder['translators'].get('validation:attachment:upload:blocked')).toEqual(
      translators['validation:attachment:upload:blocked'],
    );
  });
  it('builds the translation', () => {
    const translators = {
      'api:attachment:upload:failed': vi.fn().mockReturnValue('failed'),
      'validation:attachment:upload:blocked': vi.fn().mockReturnValue('blocked'),
    };
    const builder = new NotificationTranslationTopic({
      i18next: mockI18Next,
      translators,
    });
    const translatedString = 'XXX';
    const key = '';

    let notification = undefined;
    expect(builder.translate(translatedString, key, { notification })).toBe(
      translatedString,
    );

    notification = { type: 'validation:attachment:upload:blocked' };
    expect(builder.translate(translatedString, key, { notification })).toBe('blocked');

    notification = { type: 'api:attachment:upload:failed' };
    expect(builder.translate(translatedString, key, { notification })).toBe('failed');
  });

  it('falls back to translating notification.message when type has no translator', () => {
    const i18next = fromPartial<i18n>({
      ...mockI18Next,
      t: vi.fn((key) =>
        key === 'notification.attachmentFileMissing' ? 'translated/file-required' : key,
      ) as unknown as i18n['t'],
    });
    const builder = new NotificationTranslationTopic({
      i18next,
    });

    const output = builder.translate('XXX', '', {
      notification: fromPartial<Notification>({
        message: 'File is required for upload attachment',
        type: 'unknown:type',
      }),
    });

    // An identifier no translator claims renders `notification.message` verbatim. It used to be run
    // through a hand-maintained table of English sentences mapped onto keys; identifiers are the seam
    // now, so prose matching would only mask a missing translator entry.
    expect(output).toBe('File is required for upload attachment');
    expect(i18next.t).not.toHaveBeenCalled();
  });

  it('does not interpolate metadata into an unrecognised message', () => {
    const i18next = fromPartial<i18n>({
      ...mockI18Next,
      t: vi.fn() as unknown as i18n['t'],
    });
    const builder = new NotificationTranslationTopic({ i18next });

    const output = builder.translate('XXX', '', {
      notification: fromPartial<Notification>({
        message: 'Attachment upload failed due to {{reason}}',
        metadata: { reason: 'network error' },
        type: 'unknown:type',
      }),
    });

    // Rendered verbatim, placeholder included. Interpolating into prose would require treating the
    // sentence as a key, which is exactly what the identifier seam replaced.
    expect(output).toBe('Attachment upload failed due to {{reason}}');
    expect(i18next.t).not.toHaveBeenCalled();
  });

  // `api:reply:search:failed` and `channel:jumpToFirstUnread:failed` were removed from the registry:
  // both were copied between the two UI SDKs and neither is emitted by this one. The registry is now
  // exhaustiveness-checked against `CoreNotificationType`, so a core identifier cannot go missing.
  it.each([
    [
      'api:location:create:failed',
      'notification.locationShareFailed',
      'Failed to share location',
    ],
    [
      'api:location:share:failed',
      'notification.locationShareFailed',
      'Failed to share location',
    ],
    ['api:poll:end:success', 'notification.pollEndSuccess', 'Poll Ended'],
    [
      'browser:location:get:failed',
      'notification.locationGetFailed',
      'Failed to retrieve location',
    ],
    [
      'validation:attachment:file:missing',
      'notification.attachmentFileMissing',
      'File is required for upload attachment',
    ],
    [
      'validation:attachment:id:missing',
      'notification.attachmentIdMissing',
      'Local upload attachment missing local id',
    ],
    [
      'validation:attachment:upload:in-progress',
      'notification.attachmentUploadInProgress',
      'Wait until all attachments have uploaded',
    ],
    [
      'validation:poll:castVote:limit',
      'notification.pollVoteLimit',
      'Reached the vote limit. Remove an existing vote first.',
    ],
  ])('translates known notification type %s', (type, key, copy) => {
    const i18next = fromPartial<i18n>({
      ...mockI18Next,
      t: vi.fn(
        (translationKey) => `translated:${translationKey}`,
      ) as unknown as i18n['t'],
    });
    const builder = new NotificationTranslationTopic({ i18next });

    const output = builder.translate('XXX', '', {
      notification: fromPartial<Notification>({
        type,
      }),
    });

    expect(output).toBe(`translated:${key}`);
    // The English copy travels with the call as i18next's inline defaultValue.
    expect(i18next.t).toHaveBeenCalledWith(key, copy);
  });

  it('normalizes reason metadata in poll creation failure translation', () => {
    const i18next = fromPartial<i18n>({
      ...mockI18Next,
      t: vi.fn((key, _defaultValue, options) =>
        key === 'notification.pollCreateFailedWithReason'
          ? `translated/reason:${options.reason}`
          : key,
      ) as unknown as i18n['t'],
    });
    const builder = new NotificationTranslationTopic({ i18next });

    const output = builder.translate('XXX', '', {
      notification: fromPartial<Notification>({
        metadata: { reason: 'NETWORK' },
        type: 'api:poll:create:failed',
      }),
    });

    expect(output).toBe('translated/reason:network');
  });

  it('prefers exact translator over default type-registry fallback', () => {
    const customTranslator = vi.fn().mockReturnValue('custom/location-failed');
    const builder = new NotificationTranslationTopic({
      i18next: mockI18Next,
      translators: { 'api:location:create:failed': customTranslator },
    });

    const output = builder.translate('XXX', '', {
      notification: fromPartial<Notification>({
        type: 'api:location:create:failed',
      }),
    });

    expect(output).toBe('custom/location-failed');
    expect(customTranslator).toHaveBeenCalledTimes(1);
  });
});
