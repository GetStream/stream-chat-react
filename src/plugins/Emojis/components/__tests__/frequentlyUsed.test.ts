import { FREQUENTLY_USED_LIMIT, resolveFrequentlyUsedEmoji } from '../frequentlyUsed';
import type { EmojiData, EmojiDataEmoji } from '../../data';

const makeEmoji = (id: string): EmojiDataEmoji => ({
  id,
  keywords: [],
  name: id,
  skins: [{ native: id, unified: id }],
  version: 1,
});

const data = {
  aliases: {},
  categories: [],
  emojis: Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => `e${i}`).map((id) => [id, makeEmoji(id)]),
  ),
} as unknown as EmojiData;

describe('resolveFrequentlyUsedEmoji', () => {
  it('caps the frequently-used list to a single row so it never wraps', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `e${i}`);
    const result = resolveFrequentlyUsedEmoji(data, ids);

    expect(result).toHaveLength(FREQUENTLY_USED_LIMIT);
  });

  it('preserves most-recent-first order', () => {
    const result = resolveFrequentlyUsedEmoji(data, ['e2', 'e0', 'e1']);

    expect(result.map((emoji) => emoji.id)).toEqual(['e2', 'e0', 'e1']);
  });

  it('drops ids missing from the dataset', () => {
    const result = resolveFrequentlyUsedEmoji(data, ['e0', 'does-not-exist', 'e1']);

    expect(result.map((emoji) => emoji.id)).toEqual(['e0', 'e1']);
  });
});
