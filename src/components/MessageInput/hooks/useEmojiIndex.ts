import { useMemo } from 'react';
import type { NimbleEmojiIndex } from 'emoji-mart';

import { useEmojiContext } from '../../../context/EmojiContext';

export const useEmojiIndex = () => {
  const { emojiConfig, EmojiIndex } = useEmojiContext('useEmojiIndex');

  const { emojiData } = emojiConfig || {};

  const emojiIndex: NimbleEmojiIndex | undefined = useMemo(() => {
    if (EmojiIndex) {
      // @ts-expect-error type here isn't registering the constructor type
      return new EmojiIndex(emojiData);
    }
  }, [emojiData, EmojiIndex]);

  return emojiIndex;
};
