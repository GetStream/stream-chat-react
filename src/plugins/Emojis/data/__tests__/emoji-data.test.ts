import emojiData from '../emoji-data.json';
import type { EmojiData } from '../types';

const data = emojiData as unknown as EmojiData;

describe('vendored emoji-data.json', () => {
  it('has exactly the aliases/categories/emojis top-level keys (no spritesheet)', () => {
    expect(Object.keys(data).sort()).toEqual(['aliases', 'categories', 'emojis']);
    expect((data as Record<string, unknown>).sheet).toBeUndefined();
  });

  it('has the 8 standard categories in the expected order', () => {
    expect(data.categories.map((category) => category.id)).toEqual([
      'people',
      'nature',
      'foods',
      'activity',
      'places',
      'objects',
      'symbols',
      'flags',
    ]);
  });

  it('every emoji has an id, a name and at least one native skin', () => {
    const emojis = Object.values(data.emojis);
    expect(emojis.length).toBeGreaterThan(1800);
    for (const emoji of emojis) {
      expect(typeof emoji.id).toBe('string');
      expect(typeof emoji.name).toBe('string');
      expect(typeof emoji.skins?.[0]?.native).toBe('string');
    }
  });
});
