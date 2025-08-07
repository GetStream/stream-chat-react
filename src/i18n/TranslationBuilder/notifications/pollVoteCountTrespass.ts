import type { Translator } from '../TranslationBuilder';
import type { NotificationTranslatorOptions } from './types';

export const pollVoteCountTrespass: Translator<NotificationTranslatorOptions> = ({ t }) =>
  t('Reached the vote limit. Remove an existing vote first.');
