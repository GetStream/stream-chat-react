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
  onClickHandler: React.MouseEventHandler<HTMLDivElement>;
  onSelectHandler: (item: EmojiData | SuggestionUser<Us> | SuggestionCommand<Co>) => void;
  selected: boolean;
  style: React.CSSProperties;
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
  /** Any additional attributes that you may want to add for underlying HTML textarea element */
  additionalTextareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /** Grow the number of rows of the textarea while you're typing */
  grow?: boolean;
  /** Function that runs on submit */
  handleSubmit?: (event: React.BaseSyntheticEvent) => void;
  /** Function that runs on change */
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  /** Listener for onfocus event on textarea */
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  /** Function to run on pasting within the textarea */
  onPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  /** Placeholder for the textarea */
  placeholder?: string;
  /** The number of rows you want the textarea to have */
  rows?: number;
  /** The value of the textarea */
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
  const { t } = useTranslationContext();
  const messageInput = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>();
  const { cooldownRemaining, disabled, emojiIndex, textareaRef: innerRef } = messageInput;

  const {
    AutocompleteSuggestionItem: SuggestionItem,
    AutocompleteSuggestionList: SuggestionList,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us, V>();

  const { onFocus, placeholder = t('Type your message'), rows = 1 } = props;

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
      additionalTextareaProps={
        props.additionalTextareaProps || messageInput.additionalTextareaProps
      }
      className='str-chat__textarea__textarea'
      containerClassName='str-chat__textarea'
      disabled={disabled || !!cooldownRemaining}
      disableMentions={messageInput.disableMentions}
      dropdownClassName='str-chat__emojisearch'
      grow={props.grow || messageInput.grow}
      handleSubmit={props.handleSubmit || messageInput.handleSubmit}
      innerRef={updateInnerRef}
      itemClassName='str-chat__emojisearch__item'
      keycodeSubmitKeys={messageInput.keycodeSubmitKeys}
      listClassName='str-chat__emojisearch__list'
      loadingComponent={LoadingIndicator}
      maxRows={messageInput.maxRows}
      minChar={0}
      onChange={props.onChange || messageInput.handleChange}
      onFocus={onFocus}
      onPaste={props.onPaste || messageInput.onPaste}
      placeholder={cooldownRemaining ? t('Slow Mode ON') : placeholder}
      replaceWord={emojiReplace}
      rows={rows}
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
