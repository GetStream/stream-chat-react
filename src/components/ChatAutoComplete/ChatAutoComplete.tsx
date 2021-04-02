import React, { useCallback, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';

import { AutoCompleteTextarea } from '../AutoCompleteTextarea';
import { CommandItem, CommandItemProps } from '../CommandItem/CommandItem';
import { EmoticonItem, EmoticonItemProps } from '../EmoticonItem/EmoticonItem';
import { LoadingIndicator, LoadingIndicatorProps } from '../Loading/LoadingIndicator';
import { UserItem, UserItemProps } from '../UserItem/UserItem';

import { useChannelContext } from '../../context/ChannelContext';
import { useChatContext } from '../../context/ChatContext';

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

export type ChatAutoCompleteProps<
  Co extends DefaultCommandType = DefaultCommandType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
> = {
  innerRef: React.MutableRefObject<HTMLTextAreaElement | undefined>;
  /** Any additional attributes that you may want to add for underlying HTML textarea element */
  additionalTextareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /** Array of commands */
  commands?: CommandResponse<Co>[];
  /** Make the textarea disabled */
  disabled?: boolean;
  /** Disable mentions */
  disableMentions?: boolean;
  /** Grow the number of rows of the textarea while you're typing */
  grow?: boolean;
  /** Function that runs on submit */
  handleSubmit?: React.FormEventHandler<HTMLFormElement>;
  /** What loading component to use for the auto complete when loading results. */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  /** Maximum number of rows */
  maxRows?: number;
  /** If true, the suggestion list will search all app users, not just current channel members/watchers. Default: false. */
  mentionAllAppUsers?: boolean;
  /** Object containing filters/sort/options overrides for mentions user query */
  mentionQueryParams?: MentionQueryParams<Us>;
  /** Minimum number of characters */
  minChar?: number;
  /** Function that runs on change */
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  /** Listener for onfocus event on textarea */
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  /** Function to run on pasting within the textarea */
  onPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  /** Handler for selecting item from suggestions list */
  onSelectItem?: (item: UserResponse<Us>) => void;
  /** Placeholder for the textarea */
  placeholder?: string;
  /** The number of rows you want the textarea to have */
  rows?: number;
  /**
   * Optional UI component prop to override the default suggestion Item component.
   * Defaults to and accepts same props as: [Item](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/Item.js)
   */
  SuggestionItem?: React.ForwardRefExoticComponent<SuggestionItemProps<Co, Us>>;
  /**
   * Optional UI component prop to override the default List component that displays suggestions.
   * Defaults to and accepts same props as: [List](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/List.js)
   */
  SuggestionList?: React.ComponentType<SuggestionListProps<Co, Us, V>>;
  /** The triggers for the textarea */
  triggers?: TriggerSettings<Co, Us, V>;
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
  props: ChatAutoCompleteProps<Co, Us, V>,
) => {
  const {
    additionalTextareaProps,
    commands,
    disabled,
    disableMentions,
    grow,
    handleSubmit,
    innerRef,
    maxRows,
    mentionAllAppUsers = false,
    mentionQueryParams = {},
    onChange,
    onFocus,
    onPaste,
    onSelectItem,
    placeholder,
    rows = 3,
    SuggestionItem,
    SuggestionList,
    triggers,
    value,
  } = props;

  const { channel, emojiConfig } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client, mutes } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const [searching, setSearching] = useState(false);

  const members = channel?.state?.members;
  const watchers = channel?.state?.watchers;
  const { emojiData, EmojiIndex } = emojiConfig || {};

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
            const result = emojis.slice(0, 10);

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
      handleSubmit={handleSubmit}
      innerRef={updateInnerRef}
      itemClassName='str-chat__emojisearch__item'
      listClassName='str-chat__emojisearch__list'
      loadingComponent={LoadingIndicator}
      maxRows={maxRows}
      minChar={0}
      mutes={mutes}
      onChange={onChange}
      onFocus={onFocus}
      onPaste={onPaste}
      placeholder={placeholder}
      replaceWord={emojiReplace}
      rows={rows}
      SuggestionItem={SuggestionItem}
      SuggestionList={SuggestionList}
      trigger={getTriggers()}
      value={value}
    />
  );
};

export const ChatAutoComplete = React.memo(
  UnMemoizedChatAutoComplete,
) as typeof UnMemoizedChatAutoComplete;
