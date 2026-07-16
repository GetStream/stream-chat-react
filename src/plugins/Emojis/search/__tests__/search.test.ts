import emojiData from '../../data/emoji-data.json';
import type { EmojiData } from '../../data/types';
import { buildEmojiSearchData, type SearchableEmoji } from '../buildEmojiSearchData';
import { runSearch } from '../search';

const index = buildEmojiSearchData(emojiData as unknown as EmojiData);
const ids = (results: SearchableEmoji[] | null) =>
  (results ?? []).map((emoji) => emoji.id);

describe('runSearch (against the vendored dataset)', () => {
  it('returns null for an empty or whitespace-only query', () => {
    expect(runSearch(index, '')).toBeNull();
    expect(runSearch(index, '   ')).toBeNull();
  });

  it('ranks an exact id match first', () => {
    expect(ids(runSearch(index, 'fire'))[0]).toBe('fire');
    expect(ids(runSearch(index, 'smile'))[0]).toBe('smile');
  });

  it('matches keywords by comma-anchored token prefix', () => {
    const thumbs = ids(runSearch(index, 'thumb'));
    expect(thumbs).toContain('+1'); // "Thumbs Up" via the "thumbsup" keyword
    expect(thumbs).toContain('-1'); // "Thumbs Down" via the "thumbsdown" keyword
  });

  it('matches (lowercased) emoticons', () => {
    const results = runSearch(index, ':)') ?? [];
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((emoji) => emoji.emoticons?.includes(':)'))).toBe(true);
  });

  it('applies AND semantics across multiple words', () => {
    const results = runSearch(index, 'red heart') ?? [];
    expect(results.map((emoji) => emoji.id)).toContain('heart'); // "Red Heart"
    // Every result matched BOTH words as comma-anchored tokens — mirroring runSearch's
    // own `indexOf(",word")`, not a loose substring that a match like "tired" would pass.
    expect(
      results.every(
        (emoji) => emoji.search.includes(',red') && emoji.search.includes(',heart'),
      ),
    ).toBe(true);
  });

  it('resolves the native character on each result', () => {
    const [first] = runSearch(index, 'fire') ?? [];
    expect(first.native).toBe('🔥');
  });

  it('respects the maxResults cap', () => {
    const capped = runSearch(index, 'face', { maxResults: 5 }) ?? [];
    expect(capped.length).toBeLessThanOrEqual(5);
    expect(capped.length).toBeGreaterThan(0);
  });
});

describe('runSearch (ranking details, synthetic data)', () => {
  const tiny = buildEmojiSearchData({
    aliases: {},
    categories: [],
    emojis: {
      aaa: {
        id: 'aaa',
        keywords: [],
        name: 'First',
        skins: [{ native: '①', unified: '' }],
        version: 1,
      },
      bbb: {
        id: 'bbb',
        keywords: ['aaa'],
        name: 'Second',
        skins: [{ native: '②', unified: '' }],
        version: 1,
      },
      // Equal-length names (and ids) so the shared "tie" keyword lands at the same
      // haystack offset in both — giving an actual score tie that the id.localeCompare
      // tie-break must resolve (otherwise score alone would decide the order).
      ccc: {
        id: 'ccc',
        keywords: ['tie'],
        name: 'Cat',
        skins: [{ native: '③', unified: '' }],
        version: 1,
      },
      ddd: {
        id: 'ddd',
        keywords: ['tie'],
        name: 'Dog',
        skins: [{ native: '④', unified: '' }],
        version: 1,
      },
    },
  } as EmojiData);

  it('returns a single match unsorted when fewer than two results', () => {
    expect(runSearch(tiny, 'first')?.map((emoji) => emoji.id)).toEqual(['aaa']);
  });

  it('scores an exact id match as 0 so it ranks before keyword matches', () => {
    // "aaa" is the id of emoji aaa (score 0) and a keyword of emoji bbb (score > 0)
    expect(runSearch(tiny, 'aaa')?.map((emoji) => emoji.id)).toEqual(['aaa', 'bbb']);
  });

  it('breaks score ties with id.localeCompare', () => {
    expect(runSearch(tiny, 'tie')?.map((emoji) => emoji.id)).toEqual(['ccc', 'ddd']);
  });
});
