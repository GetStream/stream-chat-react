import React, { useCallback, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';

import { AutoCompleteTextarea } from '../AutoCompleteTextarea';
import { CommandItem, CommandItemProps } from '../CommandItem/CommandItem';
import { EmoticonItem, EmoticonItemProps } from '../EmoticonItem/EmoticonItem';
import { LoadingIndicator } from '../Loading/LoadingIndicator';
import { UserItem, UserItemProps } from '../UserItem/UserItem';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useMessageInputContext } from '../../context/MessageInputContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { EmojiData, NimbleEmojiIndex } from 'emoji-mart';
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

export type TriggerSetting<T extends UnknownType = UnknownType, U = UnknownType> = {
  component: string | React.ComponentType<T>;
  dataProvider: (
    query: string,
    text: string,
    onReady: (data: (U | undefined)[], token: string) => void,
  ) => U[];
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
> = TriggerSetting<Partial<CommandItemProps>, SuggestionCommand<Co>>;

export type EmojiTriggerSetting = TriggerSetting<Partial<EmoticonItemProps>, EmojiData>;

export type UserTriggerSetting<Us extends DefaultUserType<Us> = DefaultUserType> = TriggerSetting<
  Partial<UserItemProps>,
  SuggestionUser<Us>
>;

export type TriggerSettings<
  Co extends DefaultCommandType = DefaultCommandType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
> = {
  [key in keyof V]: TriggerSetting<V[key]['componentProps'], V[key]['data']>;
} & {
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
  const commands = messageInput.getCommands();
  const {
    additionalTextareaProps,
    onSelectItem,
    textareaRef: innerRef,
    disabled,
    disableMentions,
    grow,
    maxRows,
    mentionAllAppUsers = false,
    mentionQueryParams = {},
    SuggestionItem,
    SuggestionList,
    autocompleteTriggers: triggers,
  } = messageInput;

  const { onFocus, placeholder = t('Type your message'), rows = 1 } = props;

  const { channel, emojiConfig } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client, mutes } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { EmojiIndex } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

  const [searching, setSearching] = useState(false);

  const members = channel?.state?.members;
  const watchers = channel?.state?.watchers;
  const { emojiData } = emojiConfig || {};

  const emojiIndex: NimbleEmojiIndex | null = useMemo(() => {
    if (EmojiIndex) {
      // @ts-expect-error type here isn't registering the constructor type
      return new EmojiIndex(emojiData);
    }
    return null;
  }, [emojiData, EmojiIndex]);

  const emojiReplace = (word: string) => {
    const found = emojiIndex?.search(word) || [];
    const emoji = found
      .filter(Boolean)
      .slice(0, 10)
      .find(({ emoticons }: EmojiData) => !!emoticons?.includes(word));
    if (!emoji || !('native' in emoji)) return null;
    return emoji.native;
  };

  const getMembersAndWatchers = useCallback(() => {
    const memberUsers = members ? Object.values(members).map(({ user }) => user) : [];
    const watcherUsers = watchers ? Object.values(watchers) : [];
    const users = [...memberUsers, ...watcherUsers];

    // make sure we don't list users twice
    const uniqueUsers = {} as Record<string, UserResponse<Us>>;

    users.forEach((user) => {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    });

    return Object.values(uniqueUsers);
  }, [members, watchers]);

  const queryMembersDebounced = useCallback(
    debounce(async (query: string, onReady: (users: UserResponse<Us>[]) => void) => {
      try {
        // @ts-expect-error
        const response = await channel.queryMembers({
          name: { $autocomplete: query },
        });

        const users = response.members.map((member) => member.user) as UserResponse<Us>[];

        if (onReady && users.length) {
          onReady(users);
        } else {
          onReady([]);
        }
      } catch (error) {
        console.log({ error });
      }
    }, 200),
    [channel],
  );

  const queryUsers = async (query: string, onReady: (users: UserResponse<Us>[]) => void) => {
    if (!query || searching) return;
    setSearching(true);

    try {
      const { users } = await client.queryUsers(
        // @ts-expect-error
        {
          $or: [{ id: { $autocomplete: query } }, { name: { $autocomplete: query } }],
          id: { $ne: client.userID },
          ...mentionQueryParams.filters,
        },
        { id: 1, ...mentionQueryParams.sort },
        { limit: 10, ...mentionQueryParams.options },
      );

      if (onReady && users.length) {
        onReady(users);
      } else {
        onReady([]);
      }
    } catch (error) {
      console.log({ error });
    }

    setSearching(false);
  };

  const queryUsersDebounced = debounce(queryUsers, 200);

  /**
   * dataProvider accepts `onReady` function, which will executed once the data is ready.
   * Another approach would have been to simply return the data from dataProvider and let the
   * component await for it and then execute the required logic. We are going for callback instead
   * of async-await since we have debounce function in dataProvider. Which will delay the execution
   * of api call on trailing end of debounce (lets call it a1) but will return with result of
   * previous call without waiting for a1. So in this case, we want to execute onReady, when trailing
   * end of debounce executes.
   */
  const getTriggers = useCallback(
    () =>
      triggers ||
      ({
        '/': {
          component: CommandItem,
          dataProvider: (query, text, onReady) => {
            if (text.indexOf('/') !== 0 || !commands) {
              return [];
            }
            const selectedCommands = commands.filter(
              (command) => command.name?.indexOf(query) !== -1,
            );

            // sort alphabetically unless the you're matching the first char
            selectedCommands.sort((a, b) => {
              let nameA = a.name?.toLowerCase();
              let nameB = b.name?.toLowerCase();
              if (nameA?.indexOf(query) === 0) {
                nameA = `0${nameA}`;
              }
              if (nameB?.indexOf(query) === 0) {
                nameB = `0${nameB}`;
              }
              // Should confirm possible null / undefined when TS is fully implemented
              if (nameA != null && nameB != null) {
                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }
              }

              return 0;
            });

            const result = selectedCommands.slice(0, 10);
            if (onReady) onReady(result, query);

            return result;
          },
          output: (entity) => ({
            caretPosition: 'next',
            key: entity.name,
            text: `/${entity.name}`,
          }),
        },
        ':': {
          component: EmoticonItem,
          dataProvider: (query, _, onReady) => {
            if (query.length === 0 || query.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
              return [];
            }
            const emojis = emojiIndex?.search(query) || [];
            // emojiIndex.search sometimes returns undefined values, so filter those out first
            const result = emojis.filter(Boolean).slice(0, 10);
            if (onReady) onReady(result, query);

            return result;
          },
          output: (entity) => ({
            caretPosition: 'next',
            key: entity.id,
            text: `${'native' in entity ? entity.native : ''}`,
          }),
        },
        '@': {
          callback: (item) => onSelectItem && onSelectItem(item),
          component: UserItem,
          dataProvider: (query, _, onReady) => {
            if (mentionAllAppUsers) {
              return queryUsersDebounced(query, (data: (UserResponse<Us> | undefined)[]) => {
                if (onReady) onReady(data, query);
              });
            }

            /**
             * By default, we return maximum 100 members via queryChannels api call.
             * Thus it is safe to assume, that if number of members in channel.state is < 100,
             * then all the members are already available on client side and we don't need to
             * make any api call to queryMembers endpoint.
             */
            if (!query || Object.values(members || {}).length < 100) {
              const users = getMembersAndWatchers();

              const matchingUsers = users.filter((user) => {
                if (user.id === client.userID) return false;
                if (!query) return true;

                if (
                  user.name !== undefined &&
                  user.name.toLowerCase().includes(query.toLowerCase())
                ) {
                  return true;
                }

                return user.id.toLowerCase().includes(query.toLowerCase());
              });

              const data = matchingUsers.slice(0, 10);

              if (onReady) onReady(data, query);

              return data;
            }

            return queryMembersDebounced(query, (data: (UserResponse<Us> | undefined)[]) => {
              if (onReady) onReady(data, query);
            });
          },
          output: (entity) => ({
            caretPosition: 'next',
            key: entity.id,
            text: `@${entity.name || entity.id}`,
          }),
        },
      } as TriggerSettings<Co, Us, V>),
    [
      commands,
      getMembersAndWatchers,
      members,
      onSelectItem,
      queryMembersDebounced,
      triggers,
      emojiIndex,
    ],
  );

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
      trigger={getTriggers()}
      value={messageInput.text}
    />
  );
};

export const ChatAutoComplete = React.memo(
  UnMemoizedChatAutoComplete,
) as typeof UnMemoizedChatAutoComplete;
