/**
 * Message translation view context: user-specific state for whether each message
 * shows original text or a translation.
 *
 * ## Spec
 *
 * - **State**: Per message list (channel vs thread), we store a map
 *   `messageId → 'original' | 'translated'`. Default for messages with `message.i18n`
 *   is `'translated'`; otherwise `'original'`.
 *
 * - **Provider placement**: The provider is tied to the **message list**, not the channel.
 *   It is rendered inside `MessageList` and `VirtualizedMessageList`. That way the
 *   main channel list and the thread list each have their own translation view state
 *   (e.g. Thread.tsx gets correct behavior without sharing channel state).
 *
 * - **Multiple translations**: `message.i18n` can contain multiple languages, e.g.:
 *   `{ en_text: "Good morning", fr_text: "Bonjour", it_text: "Buongiorno", language: "en" }`.
 *   Which translation is shown is determined by the app’s **user language**
 *   (`useTranslationContext().userLanguage`). We use `message.i18n[userLanguage + '_text']`;
 *   if missing, we fall back to `message.text`. Only one translation is shown at a time.
 *
 * - **Source language**: When present, `message.i18n.language` is the original/source
 *   language of `message.text`. It can be used for the indicator label, e.g.
 *   "Translated from English · View original".
 *
 * - **Invariants**: The original message content, layout, grouping, and order stay
 *   unchanged. Removing or toggling translation only changes the annotation and which
 *   text is displayed. "View original" / "View translation" switch the displayed
 *   text and update the annotation (e.g. "Original · View translation" when showing
 *   original).
 *
 * - **Translation indicator visibility**: The translation indicator (e.g. "Translated ·
 *   View original") is **not** shown when the currently viewed text already corresponds
 *   to `userLanguage` — for example when viewing original and the original text is the
 *   user-language version (i.e. `getTranslatedMessageText({ language: userLanguage, message })`
 *   equals `message.text`). In that case there is no meaningful original/translated choice,
 *   so the indicator is hidden.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { LocalMessage, TranslationLanguages } from 'stream-chat';

/**
 * Returns the translated message text for a given language from `message.i18n`, or
 * undefined if not present. Used to resolve which of the multiple translations to show.
 */
export const getTranslatedMessageText = ({
  language,
  message,
}: {
  language: string;
  message?: LocalMessage;
}): string | undefined =>
  message?.i18n?.[`${language}_text` as `${TranslationLanguages}_text`];

/**
 * Which message text to show.
 * - `'original'`: `message.text` (source language).
 * - `'translated'`: translation for the **current user language** (TranslationContext’s
 *   `userLanguage`), i.e. `getTranslatedMessageText({ language: userLanguage, message })`
 *   or fallback to `message.text`.
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

export const useMessageTranslationViewContext =
  (): MessageTranslationViewContextValue => {
    const context = useContext(MessageTranslationViewContext);
    return context ?? defaultContextValue;
  };
