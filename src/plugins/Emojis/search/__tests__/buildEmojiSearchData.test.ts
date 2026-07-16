import { buildEmojiSearchData } from '../buildEmojiSearchData';
import type { EmojiData } from '../../data/types';

const makeData = (): EmojiData =>
  ({
    aliases: {},
    categories: [],
    emojis: {
      smile: {
        id: 'smile',
        keywords: ['happy'],
        name: 'Smile',
        skins: [{ native: '😄', unified: '1f604' }],
        version: 1,
      },
    },
  }) as unknown as EmojiData;

describe('buildEmojiSearchData', () => {
  it('memoizes by data object so the panel and middleware share a single build', () => {
    const data = makeData();
    expect(buildEmojiSearchData(data)).toBe(buildEmojiSearchData(data));
  });

  it('builds a distinct index for a different data object', () => {
    expect(buildEmojiSearchData(makeData())).not.toBe(buildEmojiSearchData(makeData()));
  });

  it('produces a comma-anchored haystack and resolves the native glyph', () => {
    const [entry] = buildEmojiSearchData(makeData());
    expect(entry.id).toBe('smile');
    expect(entry.search).toContain(',smile');
    expect(entry.native).toBe('😄');
  });
});
