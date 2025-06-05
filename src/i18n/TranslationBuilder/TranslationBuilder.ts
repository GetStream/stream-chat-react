import type { i18n, TFunction } from 'i18next';

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

  constructor(private i18next: i18n) {}

  registerTopic = (name: string, Topic: TranslationTopicConstructor) => {
    const topic = new Topic({ i18next: this.i18next });
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
    return topic;
  };

  disableTopic = (topicName: string) => {
    const topic = this.topics.get(topicName);
    if (!topic) return;
    this.i18next.use({
      name: topicName,
      process: forwardTranslation,
      type: 'postProcessor',
    });
    this.topics.delete(topicName);
  };

  getTopic = (topicName: string) => this.topics.get(topicName);

  registerTranslators(topicName: string, translators: Record<string, Translator>) {
    const topic = this.getTopic(topicName);
    if (!topic) return;
    Object.entries(translators).forEach(([name, translator]) => {
      topic.setTranslator(name, translator);
    });
  }

  removeTranslators(topicName: string, translators: string[]) {
    const topic = this.getTopic(topicName);
    if (!topic) return;
    translators.forEach((name) => {
      topic.removeTranslator(name);
    });
  }
}
