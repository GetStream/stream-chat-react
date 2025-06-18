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

  it('stores translators for non-existent topic in a buffer', () => {
    const manager = new TranslationBuilder(mockI18Next);
    const translators = { custom1: jest.fn(), custom2: jest.fn() };
    manager.registerTranslators('notification', translators);
    expect(manager.topics.size).toEqual(0);
    expect(manager.translatorRegistrationsBuffer.notification).toEqual(translators);
  });

  it('removes translators from buffer on translation removal', () => {
    const manager = new TranslationBuilder(mockI18Next);
    const translators = { custom1: jest.fn(), custom2: jest.fn() };
    manager.registerTranslators('notification', translators);
    manager.removeTranslators('notification', ['custom1']);
    expect(Object.keys(manager.translatorRegistrationsBuffer.notification).length).toBe(
      1,
    );
    expect(manager.translatorRegistrationsBuffer.notification.custom2).toBeDefined();
  });

  it('flushes the buffered translators on topic registration', () => {
    const manager = new TranslationBuilder(mockI18Next);
    const translators = { custom1: jest.fn(), custom2: jest.fn() };
    manager.registerTranslators('notification', translators);
    manager.registerTopic('notification', NotificationTranslationTopic);
    expect(manager.translatorRegistrationsBuffer.notification).toBeUndefined();
  });

  it("overrides the topic's translators with buffered translators", () => {
    const manager = new TranslationBuilder(mockI18Next);
    const translator = jest.fn().mockImplementation();
    const translatorName = 'api:attachment:upload:failed';
    const translators = { [translatorName]: translator };
    manager.registerTranslators('notification', translators);
    manager.registerTopic('notification', NotificationTranslationTopic);
    manager
      .getTopic('notification')
      .translate('key', 'value', { notification: { type: translatorName } });

    expect(translator).toHaveBeenCalledTimes(1);
  });

  it('reuses the already registered topic on repeated registerTopic calls', () => {
    const manager = new TranslationBuilder(mockI18Next);
    class Topic {
      constructor() {
        this.id = Math.random().toString();
      }
    }
    manager.registerTopic('custom', Topic);
    const firstRegistrationId = manager.getTopic('custom').id;
    manager.registerTopic('custom', Topic);
    const secondRegistrationId = manager.getTopic('custom').id;
    expect(firstRegistrationId).toBe(secondRegistrationId);
  });
});
