import type { PropsWithChildren } from 'react';
import React from 'react';

import { useCommandTrigger } from './hooks/useCommandTrigger';
import { useEmojiTrigger } from './hooks/useEmojiTrigger';
import { useUserTrigger } from './hooks/useUserTrigger';

import {
  MessageInputContextProvider,
  useMessageInputContext,
} from '../../context/MessageInputContext';

import type {
  SuggestionCommand,
  SuggestionUser,
} from '../ChatAutoComplete/ChatAutoComplete';
import type { CommandItemProps } from '../CommandItem/CommandItem';
import type { EmoticonItemProps } from '../EmoticonItem/EmoticonItem';
import type { UserItemProps } from '../UserItem/UserItem';

import type { CustomTrigger, UnknownType } from '../../types/types';
import { useMessageComposer } from './hooks/messageComposer/useMessageComposer';

export type AutocompleteMinimalData = {
  id?: string;
  name?: string;
} & ({ id: string } | { name: string });

export type CommandTriggerSetting = TriggerSetting<CommandItemProps, SuggestionCommand>;

export type EmojiTriggerSetting = TriggerSetting<EmoticonItemProps>;

export type UserTriggerSetting = TriggerSetting<UserItemProps, SuggestionUser>;

export type TriggerSetting<T extends UnknownType = UnknownType, U = UnknownType> = {
  component: string | React.ComponentType<T>;
  dataProvider: (
    query: string,
    text: string,
    onReady: (data: (U & AutocompleteMinimalData)[], token: string) => void,
  ) => U[] | PromiseLike<void> | void;
  output: (entity: U) =>
    | {
        caretPosition: 'start' | 'end' | 'next' | number;
        text: string;
        key?: string;
      }
    | string
    | null;
  callback?: (item: U) => void;
};

export type TriggerSettings<V extends CustomTrigger = CustomTrigger> =
  | {
      [key in keyof V]: TriggerSetting<V[key]['componentProps'], V[key]['data']>;
    }
  | {
      '/': CommandTriggerSetting;
      ':': EmojiTriggerSetting;
      '@': UserTriggerSetting;
    };

export const DefaultTriggerProvider = <V extends CustomTrigger = CustomTrigger>({
  children,
}: PropsWithChildren<Record<string, unknown>>) => {
  const currentValue = useMessageInputContext<V>('DefaultTriggerProvider');
  const messageComposer = useMessageComposer();

  const defaultAutocompleteTriggers: TriggerSettings = {
    '/': useCommandTrigger(),
    ':': useEmojiTrigger(currentValue.emojiSearchIndex),
    '@': useUserTrigger({
      disableMentions: currentValue.disableMentions,
      mentionAllAppUsers: currentValue.mentionAllAppUsers,
      mentionQueryParams: currentValue.mentionQueryParams,
      onSelectUser: messageComposer.textComposer.upsertMentionedUser,
      useMentionsTransliteration: currentValue.useMentionsTransliteration,
    }),
  };

  const newValue = {
    ...currentValue,
    autocompleteTriggers: defaultAutocompleteTriggers,
  };

  return (
    <MessageInputContextProvider value={newValue}>{children}</MessageInputContextProvider>
  );
};
