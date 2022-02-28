import { useMemo } from 'react';

import type { TypingContextValue } from '../../../context/TypingContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateTypingContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  value: TypingContextValue<StreamChatGenerics>,
) => {
  const { typing } = value;

  const typingValue = Object.keys(typing || {}).join();

  const typingContext: TypingContextValue<StreamChatGenerics> = useMemo(
    () => ({
      typing,
    }),
    [typingValue],
  );

  return typingContext;
};
