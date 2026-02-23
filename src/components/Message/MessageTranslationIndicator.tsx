import type { LocalMessage } from 'stream-chat';
import React, { useCallback, useMemo } from 'react';
import { IconTranslate } from '../Icons';
import {
  getTranslatedMessageText,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';

export type TranslationIndicatorProps = {
  message?: LocalMessage;
};

export const MessageTranslationIndicator = ({
  message: propMessage,
}: TranslationIndicatorProps) => {
  const { t, userLanguage } = useTranslationContext();
  const {
    message: contextMessage,
    setTranslationView,
    translationView,
  } = useMessageContext('MessageTranslationIndicator');
  const message = propMessage ?? contextMessage;

  const translatedTextForUser = useMemo(
    () => getTranslatedMessageText({ language: userLanguage, message }),
    [userLanguage, message],
  );

  const hasTranslationForUserLanguage = useMemo(
    () =>
      translatedTextForUser != null &&
      message?.text !== undefined &&
      translatedTextForUser !== message.text,
    [translatedTextForUser, message?.text],
  );

  const viewingOriginal = useMemo(
    () =>
      translationView === 'original' ||
      (translationView === undefined && !hasTranslationForUserLanguage),
    [translationView, hasTranslationForUserLanguage],
  );

  const handleToggle = useCallback(() => {
    setTranslationView?.(viewingOriginal ? 'translated' : 'original');
  }, [setTranslationView, viewingOriginal]);

  const sourceLanguageName = useMemo(() => {
    const sourceLanguageCode = message?.i18n?.language;
    if (!sourceLanguageCode) return '';
    const languageKey = 'language/' + sourceLanguageCode;
    const translatedName = t(languageKey);
    return translatedName && translatedName !== languageKey
      ? translatedName
      : sourceLanguageCode;
  }, [message?.i18n?.language, t]);

  if (!message?.i18n || !setTranslationView) return null;
  if (!hasTranslationForUserLanguage) return null;

  return (
    <div className='str-chat__message-translation-indicator'>
      <IconTranslate />
      <span className='str-chat__message-translation-indicator__sign'>
        {viewingOriginal
          ? t('Original')
          : sourceLanguageName
            ? t('Translated from {{ language }}', { language: sourceLanguageName })
            : t('Translated')}
      </span>
      <span> · </span>
      <Button
        className='str-chat__message-translation-indicator__translation-toggle'
        onClick={handleToggle}
        type='button'
      >
        {viewingOriginal ? t('View translation') : t('View original')}
      </Button>
    </div>
  );
};
