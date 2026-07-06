import type { EmojiData } from '../types';
import { filterEmojiData, isCountryFlag } from '../filterEmojiData';

const DATA: EmojiData = {
  aliases: {},
  categories: [
    { emojis: ['grinning', 'smile'], id: 'people' },
    { emojis: ['us', 'fr', 'checkered_flag'], id: 'flags' },
  ],
  emojis: {
    checkered_flag: {
      id: 'checkered_flag',
      keywords: [],
      name: 'Checkered Flag',
      skins: [{ native: '🏁', unified: '1f3c1' }],
      version: 1,
    },
    fr: {
      id: 'fr',
      keywords: [],
      name: 'France',
      skins: [{ native: '🇫🇷', unified: '1f1eb-1f1f7' }],
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

describe('isCountryFlag', () => {
  it('is true only for regional-indicator pairs', () => {
    expect(isCountryFlag(DATA.emojis.us)).toBe(true);
    expect(isCountryFlag(DATA.emojis.fr)).toBe(true);
    expect(isCountryFlag(DATA.emojis.checkered_flag)).toBe(false);
    expect(isCountryFlag(DATA.emojis.grinning)).toBe(false);
  });
});

describe('filterEmojiData', () => {
  it('returns the same reference when no filters apply', () => {
    expect(filterEmojiData(DATA, {})).toBe(DATA);
  });

  it('drops exceptEmojis and prunes them from categories', () => {
    const out = filterEmojiData(DATA, { exceptEmojis: ['smile'] });
    expect(out.emojis.smile).toBeUndefined();
    expect(out.categories.find((c) => c.id === 'people')?.emojis).toEqual(['grinning']);
  });

  it('drops emoji newer than emojiVersion', () => {
    const out = filterEmojiData(DATA, { emojiVersion: 1 });
    expect(out.emojis.smile).toBeUndefined(); // version 13 > 1
    expect(out.emojis.grinning).toBeDefined();
  });

  it('drops country flags but keeps non-country flags when noCountryFlags', () => {
    const out = filterEmojiData(DATA, { noCountryFlags: true });
    expect(out.emojis.us).toBeUndefined();
    expect(out.emojis.fr).toBeUndefined();
    expect(out.emojis.checkered_flag).toBeDefined();
  });

  it('removes a category entirely when all its emoji are filtered out', () => {
    const out = filterEmojiData(DATA, {
      exceptEmojis: ['checkered_flag'],
      noCountryFlags: true,
    });
    expect(out.categories.find((c) => c.id === 'flags')).toBeUndefined();
  });
});
