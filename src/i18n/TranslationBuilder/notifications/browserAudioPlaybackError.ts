import type { Translator } from '../TranslationBuilder';
import type { NotificationTranslatorOptions } from './types';

export const browserAudioPlaybackError: Translator<NotificationTranslatorOptions> = ({
  options,
  t,
}) => options.notification?.message ?? t('Error reproducing the recording');
