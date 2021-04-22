import React, { useCallback } from 'react';

import { AutoCompleteTextarea } from '../AutoCompleteTextarea';
import type { CommandItemProps } from '../CommandItem/CommandItem';
import type { EmoticonItemProps } from '../EmoticonItem/EmoticonItem';
import { LoadingIndicator } from '../Loading/LoadingIndicator';
import type { UserItemProps } from '../UserItem/UserItem';

import { useChatContext } from '../../context/ChatContext';
import { useMessageInputContext } from '../../context/MessageInputContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { EmojiData } from 'emoji-mart';
import type {
  CommandResponse,
  UserFilters,
  UserOptions,
  UserResponse,
  UserSort,
} from 'stream-chat';

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

type ObjectUnion<T> = T[keyof T];

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

export type SuggestionCommand<
  Co extends DefaultCommandType = DefaultCommandType
> = CommandResponse<Co>;

export type SuggestionUser<Us extends DefaultUserType<Us> = DefaultUserType> = UserResponse<Us>;

export type AutocompleteMinimalData = {
  id?: string;
  name?: string;
} & ({ id: string } | { name: string });

export type TriggerSetting<T extends UnknownType = UnknownType, U = UnknownType> = {
  component: string | React.ComponentType<T>;
  dataProvider: (
    query: string,
    text: string,
    onReady: (data: (U & AutocompleteMinimalData)[], token: string) => void,
  ) => U[] | Promise<void> | undefined;
  output: (
    entity: U,
  ) =>
    | {
        caretPosition: 'start' | 'end' | 'next' | number;
        text: string;
        key?: string;
      }
    | string
    | null;
  callback?: (item: U) => void;
};

export type CommandTriggerSetting<
  Co extends DefaultCommandType = DefaultCommandType
> = TriggerSetting<CommandItemProps, SuggestionCommand<Co>>;

export type EmojiTriggerSetting = TriggerSetting<EmoticonItemProps, EmojiData>;

export type UserTriggerSetting<Us extends DefaultUserType<Us> = DefaultUserType> = TriggerSetting<
  UserItemProps,
  SuggestionUser<Us>
>;

export type TriggerSettings<
  Co extends DefaultCommandType = DefaultCommandType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
> =
  | {
      [key in keyof V]: TriggerSetting<V[key]['componentProps'], V[key]['data']>;
    }
  | {
      '/': CommandTriggerSetting<Co>;
      ':': EmojiTriggerSetting;
      '@': UserTriggerSetting<Us>;
    };

export type MentionQueryParams<Us extends DefaultUserType<Us> = DefaultUserType> = {
  filters?: UserFilters<Us>;
  options?: UserOptions;
  sort?: UserSort<Us>;
};

export type ChatAutoCompleteProps = {
  /** Listener for onfocus event on textarea */
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  /** Placeholder for the textarea */
  placeholder?: string;
  /** The number of rows you want the textarea to have */
  rows?: number;
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
  const {
    additionalTextareaProps,
    autocompleteTriggers,
    disabled,
    disableMentions,
    emojiIndex,
    grow,
    maxRows,
    SuggestionItem,
    SuggestionList,
    textareaRef: innerRef,
  } = messageInput;

  const { onFocus, placeholder = t('Type your message'), rows = 1 } = props;

  const { mutes } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

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
      additionalTextareaProps={additionalTextareaProps}
      className='str-chat__textarea__textarea'
      containerClassName='str-chat__textarea'
      disabled={disabled}
      disableMentions={disableMentions}
      dropdownClassName='str-chat__emojisearch'
      grow={grow}
      handleSubmit={messageInput.handleSubmit}
      innerRef={updateInnerRef}
      itemClassName='str-chat__emojisearch__item'
      listClassName='str-chat__emojisearch__list'
      loadingComponent={LoadingIndicator}
      maxRows={maxRows}
      minChar={0}
      mutes={mutes}
      onChange={messageInput.handleChange}
      onFocus={onFocus}
      onPaste={messageInput.onPaste}
      placeholder={placeholder}
      replaceWord={emojiReplace}
      rows={rows}
      SuggestionItem={SuggestionItem}
      SuggestionList={SuggestionList}
      trigger={autocompleteTriggers || {}}
      value={messageInput.text}
    />
  );
};

export const ChatAutoComplete = React.memo(
  UnMemoizedChatAutoComplete,
) as typeof UnMemoizedChatAutoComplete;
