import { EmoticonItem } from '../../EmoticonItem/EmoticonItem';
import type { EmojiSearchIndex } from '../MessageInput';

export const useEmojiTrigger = (emojiSearchIndex?: EmojiSearchIndex) => ({
  component: EmoticonItem,
  // @ts-expect-error tmp
  dataProvider: async (query, _, onReady) => {
    if (query.length === 0 || query.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
      return onReady([], query);
    }
    const emojis = (await emojiSearchIndex?.search(query)) ?? [];

    // emojiIndex.search sometimes returns undefined values, so filter those out first
    const result = emojis
      .filter(Boolean)
      .slice(0, 7)
      .map(({ id, name, native, skins = [] }) => {
        const [firstSkin] = skins;

        return {
          id,
          name,
          native: native ?? firstSkin.native,
        };
      });

    if (onReady) onReady(result, query);
  },
  // @ts-expect-error tmp
  output: (entity) => ({
    caretPosition: 'next',
    key: entity.id as string,
    text: `${'native' in entity ? entity.native : ''}`,
  }),
});
