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
  } = useMessageContext();
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
    // `language.*` keys are part of the catalog now (core derives them from the same
    // `TranslationLanguage` union this code is), so the key is checked at compile time rather than
    // escaping through `asDynamicKey()`.
    //
    // The miss-detection stays, though: `message.i18n.language` is *server* data while the union is
    // generated when the SDK is built, so a language the translation API learns after this release has
    // no entry and i18next echoes the key back. Without the comparison the indicator reads
    // "Translated from language.sw" rather than falling back to the bare code.
    const languageKey = `language.${sourceLanguageCode}` as const;
    const translatedName = t(languageKey);
    return translatedName === languageKey ? sourceLanguageCode : translatedName;
  }, [message?.i18n?.language, t]);

  if (!message?.i18n || !setTranslationView) return null;
  if (!hasTranslationForUserLanguage) return null;

  return (
    <div className='str-chat__message-translation-indicator'>
      <IconTranslate />
      <span className='str-chat__message-translation-indicator__sign'>
        {viewingOriginal
          ? t('message.translationIndicator.original.text', 'Original')
          : sourceLanguageName
            ? t(
                'message.translationIndicator.translated.withLanguage.text',
                'Translated from {{ language }}',
                { language: sourceLanguageName },
              )
            : t('message.translationIndicator.translated.text', 'Translated')}
      </span>
      <span> · </span>
      <Button
        className='str-chat__message-translation-indicator__translation-toggle'
        onClick={handleToggle}
        type='button'
      >
        {viewingOriginal
          ? t('message.translationIndicator.viewTranslation.text', 'View translation')
          : t('message.translationIndicator.viewOriginal.text', 'View original')}
      </Button>
    </div>
  );
};
