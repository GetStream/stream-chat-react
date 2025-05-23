import { NotificationTranslationTopic } from '../TranslationBuilder';
import { defaultNotificationTranslators } from '../TranslationBuilder/notifications/NotificationTranslationTopic';

const mockI18Next = { id: 'mockI18Next', use: jest.fn() };
describe('NotificationTranslationTopic', () => {
  it('gets initiated with defaults', () => {
    const builder = new NotificationTranslationTopic({ i18next: mockI18Next });
    expect(builder.i18next).toEqual(mockI18Next);
    expect(builder.translators.size).toBe(
      Object.keys(defaultNotificationTranslators).length,
    );
  });

  it('gets initiated with custom translators', () => {
    const translators = {
      'attachment.upload.blocked': jest.fn(),
      test: jest.fn(),
    };
    const builder = new NotificationTranslationTopic({
      i18next: mockI18Next,
      translators,
    });
    expect(builder.translators.size).toBe(
      Object.keys(defaultNotificationTranslators).length + 1,
    );
    expect(builder.translators.get('test')).toEqual(translators.test);
    expect(builder.translators.get('attachment.upload.blocked')).toEqual(
      translators['attachment.upload.blocked'],
    );
  });
  it('builds the translation', () => {
    const translators = {
      'attachment.upload.blocked': jest.fn().mockReturnValue('blocked'),
      'attachment.upload.failed': jest.fn().mockReturnValue('failed'),
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

    notification = { code: 'attachment.upload.blocked' };
    expect(builder.translate(translatedString, key, { notification })).toBe('blocked');

    notification = { code: 'attachment.upload.failed' };
    expect(builder.translate(translatedString, key, { notification })).toBe('failed');
  });
});
