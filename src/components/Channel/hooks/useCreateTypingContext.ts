import { useMemo } from 'react';

import type { TypingContextValue } from '../../../context/TypingContext';

export const useCreateTypingContext = (value: TypingContextValue) => {
  const { typing } = value;

  const typingValue = Object.keys(typing || {}).join();

  const typingContext: TypingContextValue = useMemo(
    () => ({
      typing,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typingValue],
  );

  return typingContext;
};
