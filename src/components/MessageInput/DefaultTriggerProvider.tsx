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
} from '../../types/types';

export type AutocompleteMinimalData = {
  id?: string;
  name?: string;
} & ({ id: string } | { name: string });

export type CommandTriggerSetting<
  Co extends DefaultCommandType = DefaultCommandType
> = TriggerSetting<CommandItemProps, SuggestionCommand<Co>>;

export type EmojiTriggerSetting = TriggerSetting<EmoticonItemProps, EmojiData>;

export type UserTriggerSetting<Us extends DefaultUserType<Us> = DefaultUserType> = TriggerSetting<
  UserItemProps,
  SuggestionUser<Us>
>;

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

export const DefaultTriggerProvider = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>({
  children,
}: PropsWithChildren<Record<string, unknown>>) => {
  const currentValue = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>(
    'DefaultTriggerProvider',
  );

  const defaultAutocompleteTriggers: TriggerSettings<Co, Us> = {
    '/': useCommandTrigger<At, Ch, Co>(),
    ':': useEmojiTrigger(currentValue.emojiIndex),
    '@': useUserTrigger<At, Ch, Co, Ev, Me, Re, Us>({
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
