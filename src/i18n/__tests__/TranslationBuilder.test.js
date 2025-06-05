import { NotificationTranslationTopic, TranslationBuilder } from '../TranslationBuilder';

const mockI18Next = { id: 'mockI18Next', use: jest.fn() };
describe('TranslationBuilder and TranslationTopic', () => {
  it('gets initiated', () => {
    const manager = new TranslationBuilder(mockI18Next);
    expect(manager.i18next).toEqual(mockI18Next);
  });
  it('registers and retrieves the builder', () => {
    const manager = new TranslationBuilder(mockI18Next);
    manager.registerTopic('notification', NotificationTranslationTopic);
    expect(manager.getTopic('notification')).toBeInstanceOf(NotificationTranslationTopic);
  });
  it('removes builder', () => {
    const manager = new TranslationBuilder(mockI18Next);
    manager.registerTopic('notification', NotificationTranslationTopic);
    manager.disableTopic('notification');
    expect(manager.getTopic('notification')).toBeUndefined();
  });
  it('registers and removes translators', () => {
    const translator = jest.fn();
    const manager = new TranslationBuilder(mockI18Next);
    manager.registerTopic('notification', NotificationTranslationTopic);
    manager.registerTranslators('notification', { test: translator });
    const notificationBuilder = manager.getTopic('notification');
    expect(notificationBuilder.translators.get('test')).toEqual(translator);
    manager.removeTranslators('notification', ['test']);
    expect(notificationBuilder.translators.get('test')).toBeUndefined();
  });
});
