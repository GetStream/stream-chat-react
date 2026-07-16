import type { EmojiData } from '../types';
import { filterEmojiData } from '../filterEmojiData';

const DATA: EmojiData = {
  aliases: {},
  categories: [
    { emojis: ['grinning', 'smile'], id: 'people' },
    { emojis: ['us', 'checkered_flag'], id: 'flags' },
  ],
  emojis: {
    checkered_flag: {
      id: 'checkered_flag',
      keywords: [],
      name: 'Checkered Flag',
      skins: [{ native: '🏁', unified: '1f3c1' }],
      version: 1,
    },
    grinning: {
      id: 'grinning',
      keywords: [],
      name: 'Grinning',
      skins: [{ native: '😀', unified: '1f600' }],
      version: 1,
    },
    smile: {
      id: 'smile',
      keywords: [],
      name: 'Smile',
      skins: [{ native: '😄', unified: '1f604' }],
      version: 13,
    },
    us: {
      id: 'us',
      keywords: [],
      name: 'United States',
      skins: [{ native: '🇺🇸', unified: '1f1fa-1f1f8' }],
      version: 1,
    },
  },
};

describe('filterEmojiData', () => {
  it('returns the same reference when nothing is excluded', () => {
    expect(filterEmojiData(DATA, {})).toBe(DATA);
    expect(filterEmojiData(DATA, { exceptEmojis: [] })).toBe(DATA);
  });

  it('drops exceptEmojis and prunes them from their category', () => {
    const out = filterEmojiData(DATA, { exceptEmojis: ['smile'] });
    expect(out.emojis.smile).toBeUndefined();
    expect(out.emojis.grinning).toBeDefined();
    expect(out.categories.find((c) => c.id === 'people')?.emojis).toEqual(['grinning']);
  });

  it('removes a category entirely when all its emoji are excluded', () => {
    const out = filterEmojiData(DATA, { exceptEmojis: ['us', 'checkered_flag'] });
    expect(out.categories.find((c) => c.id === 'flags')).toBeUndefined();
    expect(out.categories.find((c) => c.id === 'people')).toBeDefined();
  });
});
