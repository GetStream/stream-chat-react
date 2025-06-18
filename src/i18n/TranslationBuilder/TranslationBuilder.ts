import type { i18n, TFunction } from 'i18next';

type TopicName = string;
type TranslatorName = string;

export type Translator<O extends Record<string, unknown> = Record<string, unknown>> =
  (params: { key: string; value: string; t: TFunction; options: O }) => string | null;

export type TranslationTopicOptions<
  O extends Record<string, unknown> = Record<string, unknown>,
> = {
  i18next: i18n;
  translators?: Record<string, Translator<O>>;
};

export abstract class TranslationTopic<
  O extends Record<string, unknown> = Record<string, unknown>,
> {
  protected translators: Map<string, Translator<O>> = new Map();
  protected i18next: i18n;

  constructor(protected options: TranslationTopicOptions<O>) {
    this.i18next = options.i18next;
    if (options.translators) {
      Object.entries(options.translators).forEach(([name, translator]) => {
        this.setTranslator(name, translator);
      });
    }
  }

  abstract translate(value: string, key: string, options: O): string;

  setTranslator = (name: string, translator: Translator<O>) => {
    this.translators.set(name, translator);
  };

  removeTranslator = (name: string) => {
    this.translators.delete(name);
  };
}

const forwardTranslation: Translator = ({ value }) => value;

export type TranslationTopicConstructor = new (
  options: TranslationTopicOptions,
) => TranslationTopic;

export class TranslationBuilder {
  private topics = new Map<string, TranslationTopic>();
  // need to keep a registration buffer so that translators can be registered once a topic is registered
  // what does not happen when Streami18n is instantiated but rather once Streami18n.init() is invoked
  private translatorRegistrationsBuffer: Record<
    TopicName,
    Record<TranslatorName, Translator>
  > = {};

  constructor(private i18next: i18n) {}

  registerTopic = (name: TopicName, Topic: TranslationTopicConstructor) => {
    let topic = this.topics.get(name);

    if (!topic) {
      topic = new Topic({ i18next: this.i18next });
      this.topics.set(name, topic);
      this.i18next.use({
        name,
        process: (value: string, key: string, options: Record<string, unknown>) => {
          const topic = this.topics.get(name);
          if (!topic) return value;
          return topic.translate(value, key, options);
        },
        type: 'postProcessor' as const,
      });
    }

    const additionalTranslatorsToRegister = this.translatorRegistrationsBuffer[name];
    if (additionalTranslatorsToRegister) {
      Object.entries(additionalTranslatorsToRegister).forEach(
        ([translatorName, translator]) => {
          topic.setTranslator(translatorName, translator);
        },
      );
      delete this.translatorRegistrationsBuffer[name];
    }
    return topic;
  };

  disableTopic = (topicName: TopicName) => {
    const topic = this.topics.get(topicName);
    if (!topic) return;
    this.i18next.use({
      name: topicName,
      process: forwardTranslation,
      type: 'postProcessor',
    });
    this.topics.delete(topicName);
  };

  getTopic = (topicName: TopicName) => this.topics.get(topicName);

  registerTranslators(
    topicName: TopicName,
    translators: Record<TranslatorName, Translator>,
  ) {
    const topic = this.getTopic(topicName);
    if (!topic) {
      if (!this.translatorRegistrationsBuffer[topicName])
        this.translatorRegistrationsBuffer[topicName] = {};

      Object.entries(translators).forEach(([translatorName, translator]) => {
        this.translatorRegistrationsBuffer[topicName][translatorName] = translator;
      });
      return;
    }
    Object.entries(translators).forEach(([name, translator]) => {
      topic.setTranslator(name, translator);
    });
  }

  removeTranslators(topicName: TopicName, translators: TranslatorName[]) {
    const topic = this.getTopic(topicName);
    if (this.translatorRegistrationsBuffer[topicName]) {
      translators.forEach((translatorName) => {
        delete this.translatorRegistrationsBuffer[topicName][translatorName];
      });
    }
    if (!topic) return;
    translators.forEach((name) => {
      topic.removeTranslator(name);
    });
  }
}
