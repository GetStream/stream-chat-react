import { NotificationTranslationTopic } from '../TranslationBuilder';
import { defaultNotificationTranslators } from '../TranslationBuilder/notifications/NotificationTranslationTopic';
import { fromPartial } from '@total-typescript/shoehorn';
import type { i18n } from 'i18next';

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
    const i18next = {
      ...mockI18Next,
      t: vi.fn((key) =>
        key === 'File is required for upload attachment'
          ? 'translated/file-required'
          : key,
      ),
    } as any;
    const builder = new NotificationTranslationTopic({
      i18next,
    });

    const output = builder.translate('XXX', '', {
      notification: {
        message: 'File is required for upload attachment',
        type: 'unknown:type',
      } as any,
    });

    expect(output).toBe('translated/file-required');
    expect(i18next.t).toHaveBeenCalledWith('File is required for upload attachment', {
      value: 'File is required for upload attachment',
    });
  });

  it('passes notification metadata to i18next for message interpolation fallback', () => {
    const i18next = {
      ...mockI18Next,
      t: vi.fn((key, options) =>
        key === 'Attachment upload failed due to {{reason}}'
          ? `translated/reason:${options.reason}`
          : key,
      ),
    } as any;
    const builder = new NotificationTranslationTopic({
      i18next,
    });

    const output = builder.translate('XXX', '', {
      notification: {
        message: 'Attachment upload failed due to {{reason}}',
        metadata: { reason: 'network error' },
        type: 'unknown:type',
      } as any,
    });

    expect(output).toBe('translated/reason:network error');
    expect(i18next.t).toHaveBeenCalledWith('Attachment upload failed due to {{reason}}', {
      reason: 'network error',
      value: 'Attachment upload failed due to {{reason}}',
    });
  });

  it.each([
    ['api:location:create:failed', 'Failed to share location'],
    ['api:location:share:failed', 'Failed to share location'],
    ['api:reply:search:failed', 'Thread has not been found'],
    ['api:poll:end:success', 'Poll ended'],
    ['browser:location:get:failed', 'Failed to retrieve location'],
    ['channel:jumpToFirstUnread:failed', 'Failed to jump to the first unread message'],
    ['validation:attachment:file:missing', 'File is required for upload attachment'],
    ['validation:attachment:id:missing', 'Local upload attachment missing local id'],
    [
      'validation:attachment:upload:in-progress',
      'Wait until all attachments have uploaded',
    ],
    [
      'validation:poll:castVote:limit',
      'Reached the vote limit. Remove an existing vote first.',
    ],
  ])('translates known notification type %s', (type, translationKey) => {
    const i18next = {
      ...mockI18Next,
      t: vi.fn((key) => `translated:${key}`),
    } as any;
    const builder = new NotificationTranslationTopic({ i18next });

    const output = builder.translate('XXX', '', {
      notification: {
        type,
      } as any,
    });

    expect(output).toBe(`translated:${translationKey}`);
    expect(i18next.t).toHaveBeenCalledWith(translationKey);
  });

  it('normalizes reason metadata in poll creation failure translation', () => {
    const i18next = {
      ...mockI18Next,
      t: vi.fn((key, options) =>
        key === 'Failed to create the poll due to {{reason}}'
          ? `translated/reason:${options.reason}`
          : key,
      ),
    } as any;
    const builder = new NotificationTranslationTopic({ i18next });

    const output = builder.translate('XXX', '', {
      notification: {
        metadata: { reason: 'NETWORK' },
        type: 'api:poll:create:failed',
      } as any,
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
      notification: {
        type: 'api:location:create:failed',
      } as any,
    });

    expect(output).toBe('custom/location-failed');
    expect(customTranslator).toHaveBeenCalledTimes(1);
  });
});
