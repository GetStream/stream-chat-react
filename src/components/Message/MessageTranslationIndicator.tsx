import type { LocalMessage, PollState } from 'stream-chat';
import React, { useCallback, useMemo } from 'react';
import {
  getTranslatedMessageText,
  useChatContext,
  useComponentContextIcons,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import { useStateStore } from '../../store';
import {
  getPollSourceLanguage,
  pollHasTranslation,
  type PollTexts,
} from '../Poll/utils/translations';

const pollTextsSelector = ({ name, name_i18n, options }: PollState): PollTexts => ({
  name,
  name_i18n,
  options,
});

export type TranslationIndicatorProps = {
  message?: LocalMessage;
};

export const MessageTranslationIndicator = ({
  message: propMessage,
}: TranslationIndicatorProps) => {
  const { IconTranslate } = useComponentContextIcons();

  const { t, userLanguage } = useTranslationContext();
  const {
    message: contextMessage,
    setTranslationView,
    translationView,
  } = useMessageContext('MessageTranslationIndicator');
  const message = propMessage ?? contextMessage;

  // The poll renders from its live state, which poll events update; `message.poll` is the snapshot
  // the message was loaded with.
  const { client } = useChatContext('MessageTranslationIndicator');
  const livePoll = message?.poll_id
    ? client?.polls.fromState(message.poll_id)
    : undefined;
  const livePollTexts = useStateStore(livePoll?.state, pollTextsSelector);
  const pollTexts = livePollTexts ?? message?.poll;

  const translatedTextForUser = useMemo(
    () => getTranslatedMessageText({ language: userLanguage, message }),
    [userLanguage, message],
  );

  // A poll message is translated when its poll is (question or options), whether or not the message
  // has text of its own.
  const hasTranslationForUserLanguage = useMemo(
    () =>
      (translatedTextForUser != null &&
        message?.text !== undefined &&
        translatedTextForUser !== message.text) ||
      pollHasTranslation(pollTexts, userLanguage),
    [translatedTextForUser, message?.text, pollTexts, userLanguage],
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
    const sourceLanguageCode =
      message?.i18n?.language ?? getPollSourceLanguage(pollTexts);
    if (!sourceLanguageCode) return '';
    const languageKey = 'language/' + sourceLanguageCode;
    const translatedName = t(languageKey);
    return translatedName && translatedName !== languageKey
      ? translatedName
      : sourceLanguageCode;
  }, [message?.i18n?.language, pollTexts, t]);

  if (!message || !setTranslationView) return null;
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
