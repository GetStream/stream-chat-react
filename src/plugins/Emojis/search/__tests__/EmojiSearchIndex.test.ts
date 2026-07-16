import { defaultEmojiSearchIndex } from '../EmojiSearchIndex';

describe('defaultEmojiSearchIndex', () => {
  it('satisfies the EmojiSearchIndex interface (async search)', () => {
    expect(typeof defaultEmojiSearchIndex.search).toBe('function');
  });

  it('resolves to [] for an empty query', async () => {
    await expect(defaultEmojiSearchIndex.search('')).resolves.toEqual([]);
    await expect(defaultEmojiSearchIndex.search('   ')).resolves.toEqual([]);
  });

  it('lazily builds the index and returns EmojiSearchIndexResult-shaped items', async () => {
    const results = (await defaultEmojiSearchIndex.search('fire')) ?? [];
    expect(results.length).toBeGreaterThan(0);
    const [first] = results;
    expect(first).toEqual(
      expect.objectContaining({
        id: 'fire',
        name: 'Fire',
        native: '🔥',
      }),
    );
    expect(Array.isArray(first.skins)).toBe(true);
    expect(first.skins[0]).toHaveProperty('native');
  });

  it('reuses the memoized index across calls', async () => {
    const first = (await defaultEmojiSearchIndex.search('smile')) ?? [];
    const second = (await defaultEmojiSearchIndex.search('smile')) ?? [];
    expect(second.map((emoji) => emoji.id)).toEqual(first.map((emoji) => emoji.id));
    expect(first[0]?.id).toBe('smile');
  });
});
