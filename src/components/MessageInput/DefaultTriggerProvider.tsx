import React from 'react';
import {
  MessageInputContextProvider,
  useMessageInputContext,
} from '../../context/MessageInputContext';
import { useCommandTrigger } from './hooks/useCommandTrigger';
import { useEmojiTrigger } from './hooks/useEmojiTrigger';
import { useUserTrigger } from './hooks/useUserTrigger';

import type { TriggerSettings } from '../ChatAutoComplete/ChatAutoComplete';
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
}: React.PropsWithChildren<Record<string, unknown>>) => {
  const currentValue = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>();

  const defaultAutocompleteTriggers: TriggerSettings<Co, Us> = {
    '/': useCommandTrigger<At, Ch, Co>(),
    ':': useEmojiTrigger(currentValue.emojiIndex),
    '@': useUserTrigger<At, Ch, Co, Ev, Me, Re, Us>(
      currentValue.mentionQueryParams,
      currentValue.onSelectUser,
      currentValue.mentionAllAppUsers,
    ),
  };

  const newValue = {
    ...currentValue,
    autocompleteTriggers: defaultAutocompleteTriggers,
  };

  return <MessageInputContextProvider value={newValue}>{children}</MessageInputContextProvider>;
};
