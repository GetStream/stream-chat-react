import React, { useCallback } from 'react';

import { LoadingIndicator } from '../Loading/LoadingIndicator';

import { useMessageInputContext } from '../../context/MessageInputContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useComponentContext } from '../../context/ComponentContext';

import type { CommandResponse, UserResponse } from 'stream-chat';

import type { UnknownType } from '../../types/types';
import type { EmojiSearchIndex, EmojiSearchIndexResult } from '../MessageInput';
import { TextareaX } from '../AutoCompleteTextarea/TextareaX';

export type SuggestionCommand = CommandResponse;

export type SuggestionUser = UserResponse;

export type SuggestionEmoji<T extends UnknownType = UnknownType> =
  EmojiSearchIndexResult & T;

export type SuggestionItem = SuggestionUser | SuggestionCommand | SuggestionEmoji;

// FIXME: entity type is wrong, fix
export type SuggestionItemProps = {
  component: React.ComponentType<{
    entity: SuggestionItem;
    selected: boolean;
  }>;
  item: SuggestionItem;
  key: React.Key;
  onClickHandler: (
    event: React.MouseEvent<Element, MouseEvent>,
    item: SuggestionItem,
  ) => void;
  onSelectHandler: (item: SuggestionItem) => void;
  selected: boolean;
  style: React.CSSProperties;
  className?: string;
  value?: string;
};

export interface SuggestionHeaderProps {
  currentTrigger: string;
  value: string;
}

export type SuggestionListProps = {
  component: React.ComponentType;
  currentTrigger: string;
  dropdownScroll: (element: HTMLElement) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSelectedItem: ((item: any) => void) | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTextToReplace: (item: any) => {
    caretPosition: 'start' | 'end' | 'next' | number;
    text: string;
    key?: string;
  };
  onSelect: (newToken: {
    caretPosition: 'start' | 'end' | 'next' | number;
    text: string;
  }) => void;
  selectionEnd: number;
  SuggestionItem: React.ComponentType<SuggestionItemProps>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any;
  className?: string;
  itemClassName?: string;
  itemStyle?: React.CSSProperties;
  Header?: React.ComponentType<SuggestionHeaderProps>;
  style?: React.CSSProperties;
  value?: string;
};

export type ChatAutoCompleteProps = {
  /** Override the default disabled state of the underlying `textarea` component. */
  disabled?: boolean;
  /** Function to override the default submit handler on the underlying `textarea` component */
  handleSubmit?: (event: React.BaseSyntheticEvent) => void;
  /** Function to run on blur of the underlying `textarea` component */
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  /** Function to override the default onChange behavior on the underlying `textarea` component */
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  /** Function to run on focus of the underlying `textarea` component */
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  /** Function to override the default onPaste behavior on the underlying `textarea` component */
  onPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  /** Placeholder for the underlying `textarea` component */
  placeholder?: string;
  /** The initial number of rows for the underlying `textarea` component */
  rows?: number;
  /** The text value of the underlying `textarea` component */
  value?: string;
  /** Function to override the default emojiReplace behavior on the `wordReplace` prop of the `textarea` component */
  wordReplace?: (word: string, emojiIndex?: EmojiSearchIndex) => string;
};

const UnMemoizedChatAutoComplete = (props: ChatAutoCompleteProps) => {
  const { AutocompleteSuggestionItem: SuggestionItem } =
    useComponentContext('ChatAutoComplete');
  const { t } = useTranslationContext('ChatAutoComplete');

  const messageInputContextValue = useMessageInputContext('ChatAutoComplete');
  const {
    cooldownRemaining,
    disabled,
    emojiSearchIndex,
    textareaRef: innerRef,
  } = messageInputContextValue;

  const placeholder = props.placeholder || t('Type your message');

  const emojiReplace = props.wordReplace
    ? (word: string) => props.wordReplace?.(word, emojiSearchIndex)
    : async (word: string) => {
        const found = (await emojiSearchIndex?.search(word)) || [];

        const emoji = found
          .filter(Boolean)
          .slice(0, 10)
          .find(({ emoticons }) => !!emoticons?.includes(word));

        if (!emoji) return null;

        const [firstSkin] = emoji.skins ?? [];

        return emoji.native ?? firstSkin.native;
      };

  const updateInnerRef = useCallback(
    (ref: HTMLTextAreaElement | null) => {
      if (innerRef) {
        innerRef.current = ref;
      }
    },
    [innerRef],
  );

  return (
    <TextareaX
      additionalTextareaProps={messageInputContextValue.additionalTextareaProps}
      aria-label={cooldownRemaining ? t('Slow Mode ON') : placeholder}
      className='str-chat__textarea__textarea str-chat__message-textarea'
      closeCommandsList={messageInputContextValue.closeCommandsList}
      closeMentionsList={messageInputContextValue.closeMentionsList}
      containerClassName='str-chat__textarea str-chat__message-textarea-react-host'
      disabled={(props.disabled ?? disabled) || !!cooldownRemaining}
      disableMentions={messageInputContextValue.disableMentions}
      grow={messageInputContextValue.grow}
      handleSubmit={props.handleSubmit || messageInputContextValue.handleSubmit}
      innerRef={updateInnerRef}
      loadingComponent={LoadingIndicator}
      maxRows={messageInputContextValue.maxRows}
      minChar={0}
      minRows={messageInputContextValue.minRows}
      onBlur={props.onBlur}
      onChange={props.onChange || messageInputContextValue.handleChange}
      onFocus={props.onFocus}
      onPaste={props.onPaste || messageInputContextValue.onPaste}
      placeholder={cooldownRemaining ? t('Slow Mode ON') : placeholder}
      replaceWord={emojiReplace}
      rows={props.rows || 1}
      shouldSubmit={messageInputContextValue.shouldSubmit}
      showCommandsList={messageInputContextValue.showCommandsList}
      showMentionsList={messageInputContextValue.showMentionsList}
      // @ts-expect-error because we would have to pass the third generic type to ComponentContext
      SuggestionItem={SuggestionItem}
      // SuggestionList={SuggestionList}
      // @ts-expect-error type mismatch
      trigger={messageInputContextValue.autocompleteTriggers || {}}
      value={props.value}
    />
  );
};

export const ChatAutoComplete = React.memo(
  UnMemoizedChatAutoComplete,
) as typeof UnMemoizedChatAutoComplete;
