import React, { useCallback } from 'react';

import { AutoCompleteTextarea } from '../AutoCompleteTextarea';
import { LoadingIndicator } from '../Loading/LoadingIndicator';

import { useMessageInputContext } from '../../context/MessageInputContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useComponentContext } from '../../context/ComponentContext';

import type { EmojiData, NimbleEmojiIndex } from 'emoji-mart';
import type { CommandResponse, UserResponse } from 'stream-chat';

import type { TriggerSettings } from '../MessageInput/DefaultTriggerProvider';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../types/types';

type ObjectUnion<T> = T[keyof T];

export type SuggestionCommand<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = CommandResponse<StreamChatGenerics>;

export type SuggestionUser<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = UserResponse<StreamChatGenerics>;

export type SuggestionItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  className: string;
  component: React.ComponentType<{
    entity: EmojiData | SuggestionUser<StreamChatGenerics> | SuggestionCommand<StreamChatGenerics>;
    selected: boolean;
  }>;
  item: EmojiData | SuggestionUser<StreamChatGenerics> | SuggestionCommand<StreamChatGenerics>;
  key: React.Key;
  onClickHandler: (event: React.BaseSyntheticEvent) => void;
  onSelectHandler: (
    item: EmojiData | SuggestionUser<StreamChatGenerics> | SuggestionCommand<StreamChatGenerics>,
  ) => void;
  selected: boolean;
  style: React.CSSProperties;
  value: string;
};

export interface SuggestionHeaderProps {
  currentTrigger: string;
  value: string;
}

export type SuggestionListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = ObjectUnion<
  {
    [key in keyof TriggerSettings<StreamChatGenerics, V>]: {
      component: TriggerSettings<StreamChatGenerics, V>[key]['component'];
      currentTrigger: string;
      dropdownScroll: (element: HTMLDivElement) => void;
      getSelectedItem:
        | ((item: Parameters<TriggerSettings<StreamChatGenerics, V>[key]['output']>[0]) => void)
        | null;
      getTextToReplace: (
        item: Parameters<TriggerSettings<StreamChatGenerics, V>[key]['output']>[0],
      ) => {
        caretPosition: 'start' | 'end' | 'next' | number;
        text: string;
        key?: string;
      };
      Header: React.ComponentType<SuggestionHeaderProps>;
      onSelect: (newToken: {
        caretPosition: 'start' | 'end' | 'next' | number;
        text: string;
      }) => void;
      selectionEnd: number;
      SuggestionItem: React.ComponentType<SuggestionItemProps>;
      values: Parameters<
        Parameters<TriggerSettings<StreamChatGenerics, V>[key]['dataProvider']>[2]
      >[0];
      className?: string;
      itemClassName?: string;
      itemStyle?: React.CSSProperties;
      style?: React.CSSProperties;
      value?: string;
    };
  }
>;

export type ChatAutoCompleteProps = {
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
  wordReplace?: (word: string, emojiIndex?: NimbleEmojiIndex) => string;
};

const UnMemoizedChatAutoComplete = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: ChatAutoCompleteProps,
) => {
  const {
    AutocompleteSuggestionItem: SuggestionItem,
    AutocompleteSuggestionList: SuggestionList,
  } = useComponentContext<StreamChatGenerics, V>('ChatAutoComplete');
  const { t } = useTranslationContext('ChatAutoComplete');

  const messageInput = useMessageInputContext<StreamChatGenerics, V>('ChatAutoComplete');
  const { cooldownRemaining, disabled, emojiIndex, textareaRef: innerRef } = messageInput;

  const placeholder = props.placeholder || t('Type your message');

  const emojiReplace = props.wordReplace
    ? (word: string) => props.wordReplace?.(word, emojiIndex)
    : (word: string) => {
        const found = emojiIndex?.search(word) || [];
        const emoji = found
          .filter(Boolean)
          .slice(0, 10)
          .find(({ emoticons }: EmojiData) => !!emoticons?.includes(word));
        if (!emoji || !('native' in emoji)) return null;
        return emoji.native;
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
    <AutoCompleteTextarea
      additionalTextareaProps={messageInput.additionalTextareaProps}
      aria-label={cooldownRemaining ? t('Slow Mode ON') : placeholder}
      className='str-chat__textarea__textarea str-chat__message-textarea'
      closeCommandsList={messageInput.closeCommandsList}
      closeMentionsList={messageInput.closeMentionsList}
      containerClassName='str-chat__textarea str-chat__message-textarea-react-host'
      disabled={disabled || !!cooldownRemaining}
      disableMentions={messageInput.disableMentions}
      dropdownClassName='str-chat__emojisearch'
      grow={messageInput.grow}
      handleSubmit={props.handleSubmit || messageInput.handleSubmit}
      innerRef={updateInnerRef}
      itemClassName='str-chat__emojisearch__item'
      listClassName='str-chat__emojisearch__list'
      loadingComponent={LoadingIndicator}
      maxRows={messageInput.maxRows}
      minChar={0}
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
      SuggestionItem={SuggestionItem}
      SuggestionList={SuggestionList}
      trigger={messageInput.autocompleteTriggers || {}}
      value={props.value || messageInput.text}
    />
  );
};

export const ChatAutoComplete = React.memo(
  UnMemoizedChatAutoComplete,
) as typeof UnMemoizedChatAutoComplete;
