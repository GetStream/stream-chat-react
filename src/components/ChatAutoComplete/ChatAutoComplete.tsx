import React, { useCallback } from 'react';

import { AutoCompleteTextarea } from '../AutoCompleteTextarea';
import { LoadingIndicator } from '../Loading/LoadingIndicator';

import { useMessageInputContext } from '../../context/MessageInputContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useComponentContext } from '../../context/ComponentContext';

import type { EmojiData } from 'emoji-mart';
import type { CommandResponse, UserResponse } from 'stream-chat';

import type { TriggerSettings } from '../MessageInput/DefaultTriggerProvider';

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

type ObjectUnion<T> = T[keyof T];

export type SuggestionCommand<
  Co extends DefaultCommandType = DefaultCommandType
> = CommandResponse<Co>;

export type SuggestionUser<Us extends DefaultUserType<Us> = DefaultUserType> = UserResponse<Us>;

export type SuggestionItemProps<
  Co extends DefaultCommandType = DefaultCommandType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  className: string;
  component: JSX.Element;
  item: EmojiData | SuggestionUser<Us> | SuggestionCommand<Co>;
  key: React.Key;
  onClickHandler: (event: React.BaseSyntheticEvent) => void;
  onSelectHandler: (item: EmojiData | SuggestionUser<Us> | SuggestionCommand<Co>) => void;
  selected: boolean;
  style: React.CSSProperties;
  value: string;
};

export type SuggestionListProps<
  Co extends DefaultCommandType = DefaultCommandType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
> = ObjectUnion<
  {
    [key in keyof TriggerSettings<Co, Us, V>]: {
      component: TriggerSettings<Co, Us, V>[key]['component'];
      dropdownScroll: (element: HTMLDivElement) => void;
      getSelectedItem:
        | ((item: Parameters<TriggerSettings<Co, Us, V>[key]['output']>[0]) => void)
        | null;
      getTextToReplace: (
        item: Parameters<TriggerSettings<Co, Us, V>[key]['output']>[0],
      ) => {
        caretPosition: 'start' | 'end' | 'next' | number;
        text: string;
        key?: string;
      };
      onSelect: (newToken: {
        caretPosition: 'start' | 'end' | 'next' | number;
        text: string;
      }) => void;
      values: Parameters<Parameters<TriggerSettings<Co, Us, V>[key]['dataProvider']>[2]>[0];
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
  /** Function to override the default onChange behavior on the underlying `textarea` component */
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  /** Function to run on focus of the underlying `textarea` component */
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  /** Function to override the default onPaste behavior on the underlying `textarea` component */
  onPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  /** Placeholder for the the underlying `textarea` component */
  placeholder?: string;
  /** The initial number of rows for the underlying `textarea` component */
  rows?: number;
  /** The text value of the underlying `textarea` component */
  value?: string;
};

const UnMemoizedChatAutoComplete = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  props: ChatAutoCompleteProps,
) => {
  const {
    AutocompleteSuggestionItem: SuggestionItem,
    AutocompleteSuggestionList: SuggestionList,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us, V>('ChatAutoComplete');
  const { t } = useTranslationContext('ChatAutoComplete');

  const messageInput = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>('ChatAutoComplete');
  const { cooldownRemaining, disabled, emojiIndex, textareaRef: innerRef } = messageInput;

  const placeholder = props.placeholder || t('Type your message');

  const emojiReplace = (word: string) => {
    const found = emojiIndex?.search(word) || [];
    const emoji = found
      .filter(Boolean)
      .slice(0, 10)
      .find(({ emoticons }: EmojiData) => !!emoticons?.includes(word));
    if (!emoji || !('native' in emoji)) return null;
    return emoji.native;
  };

  const updateInnerRef = useCallback(
    (ref) => {
      if (innerRef) {
        innerRef.current = ref;
      }
    },
    [innerRef],
  );

  return (
    <AutoCompleteTextarea
      additionalTextareaProps={messageInput.additionalTextareaProps}
      className='str-chat__textarea__textarea'
      closeCommandsList={messageInput.closeCommandsList}
      closeMentionsList={messageInput.closeMentionsList}
      containerClassName='str-chat__textarea'
      disabled={disabled || !!cooldownRemaining}
      disableMentions={messageInput.disableMentions}
      dropdownClassName='str-chat__emojisearch'
      grow={messageInput.grow}
      handleSubmit={props.handleSubmit || messageInput.handleSubmit}
      innerRef={updateInnerRef}
      itemClassName='str-chat__emojisearch__item'
      keycodeSubmitKeys={messageInput.keycodeSubmitKeys}
      listClassName='str-chat__emojisearch__list'
      loadingComponent={LoadingIndicator}
      maxRows={messageInput.maxRows}
      minChar={0}
      onChange={props.onChange || messageInput.handleChange}
      onFocus={props.onFocus}
      onPaste={props.onPaste || messageInput.onPaste}
      placeholder={cooldownRemaining ? t('Slow Mode ON') : placeholder}
      replaceWord={emojiReplace}
      rows={props.rows || 1}
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
