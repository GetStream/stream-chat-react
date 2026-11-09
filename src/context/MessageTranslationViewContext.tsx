// Whether each message shows its original or translated text. State is per message ID and the
// provider sits in each message list, so a channel and its threads do not share it. Messages with
// `message.i18n` default to 'translated'. The translation shown is the `${userLanguage}_text`
// entry of `message.i18n`, falling back to `message.text`.

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { LocalMessage, TranslationLanguage } from 'stream-chat';

/** Returns the text of `message.i18n` for the language, or undefined when there is none. */
export const getTranslatedMessageText = ({
  language,
  message,
}: {
  language: string;
  message?: LocalMessage;
}): string | undefined =>
  message?.i18n?.[`${language}_text` as `${TranslationLanguage}_text`];

/**
 * Which message text to show: `'original'` is `message.text`, `'translated'` is the translation
 * for `userLanguage`, falling back to `message.text`.
 */
export type TranslationView = 'original' | 'translated';

export type MessageTranslationViewContextValue = {
  getTranslationView: (messageId: string, hasI18n: boolean) => TranslationView;
  setTranslationView: (messageId: string, view: TranslationView) => void;
};

const defaultContextValue: MessageTranslationViewContextValue = {
  getTranslationView: (_messageId, hasI18n) => (hasI18n ? 'translated' : 'original'),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setTranslationView: () => {},
};

export const MessageTranslationViewContext =
  createContext<MessageTranslationViewContextValue>(defaultContextValue);

export const MessageTranslationViewProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [viewByMessageId, setViewByMessageId] = useState<Record<string, TranslationView>>(
    {},
  );

  const setTranslationView = useCallback((messageId: string, view: TranslationView) => {
    setViewByMessageId((prev) => ({ ...prev, [messageId]: view }));
  }, []);

  const getTranslationView = useCallback(
    (messageId: string, hasI18n: boolean): TranslationView =>
      viewByMessageId[messageId] ?? (hasI18n ? 'translated' : 'original'),
    [viewByMessageId],
  );

  const stableValue = React.useMemo(
    () => ({ getTranslationView, setTranslationView }),
    [getTranslationView, setTranslationView],
  );

  return (
    <MessageTranslationViewContext.Provider value={stableValue}>
      {children}
    </MessageTranslationViewContext.Provider>
  );
};

// The context has a default value, so there is no missing-provider case.
export const useMessageTranslationViewContext = () =>
  useContext(MessageTranslationViewContext);
