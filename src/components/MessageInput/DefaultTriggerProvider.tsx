import React, { PropsWithChildren } from 'react';

import { useCommandTrigger } from './hooks/useCommandTrigger';
import { useEmojiTrigger } from './hooks/useEmojiTrigger';
import { useUserTrigger } from './hooks/useUserTrigger';

import {
  MessageInputContextProvider,
  useMessageInputContext,
} from '../../context/MessageInputContext';

import type { EmojiData } from 'emoji-mart';

import type { SuggestionCommand, SuggestionUser } from '../ChatAutoComplete/ChatAutoComplete';
import type { CommandItemProps } from '../CommandItem/CommandItem';
import type { EmoticonItemProps } from '../EmoticonItem/EmoticonItem';
import type { UserItemProps } from '../UserItem/UserItem';

import type { CustomTrigger, DefaultStreamChatGenerics, UnknownType } from '../../types/types';

export type AutocompleteMinimalData = {
  id?: string;
  name?: string;
} & ({ id: string } | { name: string });

export type CommandTriggerSetting<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = TriggerSetting<CommandItemProps, SuggestionCommand<StreamChatGenerics>>;

export type EmojiTriggerSetting = TriggerSetting<EmoticonItemProps, EmojiData>;

export type UserTriggerSetting<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = TriggerSetting<UserItemProps, SuggestionUser<StreamChatGenerics>>;

export type TriggerSetting<T extends UnknownType = UnknownType, U = UnknownType> = {
  component: string | React.ComponentType<T>;
  dataProvider: (
    query: string,
    text: string,
    onReady: (data: (U & AutocompleteMinimalData)[], token: string) => void,
  ) => U[] | Promise<void> | void;
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

export type TriggerSettings<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> =
  | {
      [key in keyof V]: TriggerSetting<V[key]['componentProps'], V[key]['data']>;
    }
  | {
      '/': CommandTriggerSetting<StreamChatGenerics>;
      ':': EmojiTriggerSetting;
      '@': UserTriggerSetting<StreamChatGenerics>;
    };

export const DefaultTriggerProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>({
  children,
}: PropsWithChildren<Record<string, unknown>>) => {
  const currentValue = useMessageInputContext<StreamChatGenerics, V>('DefaultTriggerProvider');

  const defaultAutocompleteTriggers: TriggerSettings<StreamChatGenerics> = {
    '/': useCommandTrigger<StreamChatGenerics>(),
    ':': useEmojiTrigger(currentValue.emojiIndex),
    '@': useUserTrigger<StreamChatGenerics>({
      disableMentions: currentValue.disableMentions,
      mentionAllAppUsers: currentValue.mentionAllAppUsers,
      mentionQueryParams: currentValue.mentionQueryParams,
      onSelectUser: currentValue.onSelectUser,
      useMentionsTransliteration: currentValue.useMentionsTransliteration,
    }),
  };

  const newValue = {
    ...currentValue,
    autocompleteTriggers: defaultAutocompleteTriggers,
  };

  return <MessageInputContextProvider value={newValue}>{children}</MessageInputContextProvider>;
};
