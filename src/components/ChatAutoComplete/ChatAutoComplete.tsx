import React, { useCallback } from 'react';

import { LoadingIndicator } from '../Loading/LoadingIndicator';

import { useMessageInputContext } from '../../context/MessageInputContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useComponentContext } from '../../context/ComponentContext';

import type { CommandResponse, UserResponse } from 'stream-chat';

import type { TriggerSettings } from '../MessageInput/DefaultTriggerProvider';
import type { CustomTrigger, UnknownType } from '../../types/types';
import type { EmojiSearchIndex, EmojiSearchIndexResult } from '../MessageInput';
import { TextareaX } from '../AutoCompleteTextarea/TextareaX';

type ObjectUnion<T> = T[keyof T];

export type SuggestionCommand = CommandResponse;

export type SuggestionUser = UserResponse;

export type SuggestionEmoji<T extends UnknownType = UnknownType> =
  EmojiSearchIndexResult & T;

export type SuggestionItem<EmojiData extends UnknownType = UnknownType> =
  | SuggestionUser
  | SuggestionCommand
  | SuggestionEmoji<EmojiData>;

// FIXME: entity type is wrong, fix
export type SuggestionItemProps<EmojiData extends UnknownType = UnknownType> = {
  component: React.ComponentType<{
    entity: SuggestionItem<EmojiData>;
    selected: boolean;
  }>;
  item: SuggestionItem<EmojiData>;
  key: React.Key;
  onClickHandler: (
    event: React.MouseEvent<Element, MouseEvent>,
    item: SuggestionItem<EmojiData>,
  ) => void;
  onSelectHandler: (item: SuggestionItem<EmojiData>) => void;
  selected: boolean;
  style: React.CSSProperties;
  className?: string;
  value?: string;
};

export interface SuggestionHeaderProps {
  currentTrigger: string;
  value: string;
}

export type SuggestionListProps<
  V extends CustomTrigger = CustomTrigger,
  EmojiData extends UnknownType = UnknownType,
> = ObjectUnion<{
  [key in keyof TriggerSettings<V>]: {
    component: TriggerSettings<V>[key]['component'];
    currentTrigger: string;
    dropdownScroll: (element: HTMLElement) => void;
    getSelectedItem:
      | ((item: Parameters<TriggerSettings<V>[key]['output']>[0]) => void)
      | null;
    getTextToReplace: (item: Parameters<TriggerSettings<V>[key]['output']>[0]) => {
      caretPosition: 'start' | 'end' | 'next' | number;
      text: string;
      key?: string;
    };
    onSelect: (newToken: {
      caretPosition: 'start' | 'end' | 'next' | number;
      text: string;
    }) => void;
    selectionEnd: number;
    SuggestionItem: React.ComponentType<SuggestionItemProps<EmojiData>>;
    values: Parameters<Parameters<TriggerSettings<V>[key]['dataProvider']>[2]>[0];
    className?: string;
    itemClassName?: string;
    itemStyle?: React.CSSProperties;
    Header?: React.ComponentType<SuggestionHeaderProps>;
    style?: React.CSSProperties;
    value?: string;
  };
}>;

export type ChatAutoCompleteProps<T extends UnknownType = UnknownType> = {
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
  wordReplace?: (word: string, emojiIndex?: EmojiSearchIndex<T>) => string;
};

const UnMemoizedChatAutoComplete = <V extends CustomTrigger = CustomTrigger>(
  props: ChatAutoCompleteProps,
) => {
  const { AutocompleteSuggestionItem: SuggestionItem } =
    useComponentContext<V>('ChatAutoComplete');
  const { t } = useTranslationContext('ChatAutoComplete');

  const messageInput = useMessageInputContext<V>('ChatAutoComplete');
  const {
    cooldownRemaining,
    disabled,
    emojiSearchIndex,
    textareaRef: innerRef,
  } = messageInput;

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
      additionalTextareaProps={messageInput.additionalTextareaProps}
      aria-label={cooldownRemaining ? t('Slow Mode ON') : placeholder}
      className='str-chat__textarea__textarea str-chat__message-textarea'
      closeCommandsList={messageInput.closeCommandsList}
      closeMentionsList={messageInput.closeMentionsList}
      containerClassName='str-chat__textarea str-chat__message-textarea-react-host'
      disabled={(props.disabled ?? disabled) || !!cooldownRemaining}
      disableMentions={messageInput.disableMentions}
      grow={messageInput.grow}
      handleSubmit={props.handleSubmit || messageInput.handleSubmit}
      innerRef={updateInnerRef}
      loadingComponent={LoadingIndicator}
      maxRows={messageInput.maxRows}
      minChar={0}
      minRows={messageInput.minRows}
      onBlur={props.onBlur}
      onChange={props.onChange || messageInput.handleChange}
      onFocus={props.onFocus}
      onPaste={props.onPaste || messageInput.onPaste}
      placeholder={cooldownRemaining ? t('Slow Mode ON') : placeholder}
      replaceWord={emojiReplace}
      rows={props.rows || 1}
      shouldSubmit={messageInput.shouldSubmit}
      showCommandsList={messageInput.showCommandsList}
      showMentionsList={messageInput.showMentionsList}
      // @ts-expect-error because we would have to pass the third generic type to ComponentContext
      SuggestionItem={SuggestionItem}
      // SuggestionList={SuggestionList}
      // @ts-expect-error type mismatch
      trigger={messageInput.autocompleteTriggers || {}}
      value={props.value}
    />
  );
};

export const ChatAutoComplete = React.memo(
  UnMemoizedChatAutoComplete,
) as typeof UnMemoizedChatAutoComplete;
