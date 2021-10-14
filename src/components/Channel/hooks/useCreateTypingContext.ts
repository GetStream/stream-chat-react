import { useMemo } from 'react';

import type { TypingContextValue } from '../../../context/TypingContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useCreateTypingContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  value: TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { typing } = value;

  const typingValue = Object.keys(typing || {}).join();

  const typingContext: TypingContextValue<At, Ch, Co, Ev, Me, Re, Us> = useMemo(
    () => ({
      typing,
    }),
    [typingValue],
  );

  return typingContext;
};
