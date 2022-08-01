import { EmoticonItem } from '../../EmoticonItem/EmoticonItem';

import { useChatContext } from '../../../context/ChatContext';

import type { NimbleEmojiIndex } from 'emoji-mart';

import type { EmojiTriggerSetting } from '../DefaultTriggerProvider';

export const useEmojiTrigger = (emojiIndex?: NimbleEmojiIndex): EmojiTriggerSetting => {
  const { themeVersion } = useChatContext('useEmojiTrigger');

  return {
    component: EmoticonItem,
    dataProvider: (query, _, onReady) => {
      if (query.length === 0 || query.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
        return [];
      }
      const emojis = emojiIndex?.search(query) || [];
      // emojiIndex.search sometimes returns undefined values, so filter those out first
      const result = emojis.filter(Boolean).slice(0, themeVersion === '2' ? 7 : 10);
      if (onReady) onReady(result, query);

      return result;
    },
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.id,
      text: `${'native' in entity ? entity.native : ''}`,
    }),
  };
};
