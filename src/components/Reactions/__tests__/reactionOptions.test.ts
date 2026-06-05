import {
  defaultReactionOptions,
  emojiToUnicode,
  getEmojiCodeByReactionType,
  mapEmojiMartData,
} from '../reactionOptions';

const noop = () => null;

describe('getEmojiCodeByReactionType', () => {
  it('returns the native emoji for a quick reaction type', () => {
    expect(getEmojiCodeByReactionType(defaultReactionOptions, 'like')).toBe('👍');
    expect(getEmojiCodeByReactionType(defaultReactionOptions, 'love')).toBe('❤️');
    expect(getEmojiCodeByReactionType(defaultReactionOptions, 'haha')).toBe('😂');
  });

  it('returns the native emoji for an extended reaction type', () => {
    const reactionOptions = {
      extended: {
        rocket: { Component: noop, name: 'Rocket', unicode: emojiToUnicode('🚀') },
      },
      quick: {},
    };

    expect(getEmojiCodeByReactionType(reactionOptions, 'rocket')).toBe('🚀');
  });

  it('returns undefined for an unknown reaction type', () => {
    expect(getEmojiCodeByReactionType(defaultReactionOptions, 'does-not-exist')).toBe(
      undefined,
    );
  });

  it('returns undefined when the matched option has no unicode', () => {
    const reactionOptions = { quick: { custom: { Component: noop, name: 'Custom' } } };

    expect(getEmojiCodeByReactionType(reactionOptions, 'custom')).toBe(undefined);
  });

  it('returns undefined for legacy array reaction options (no unicode data)', () => {
    const reactionOptions = [{ Component: noop, name: 'Like', type: 'like' }];

    expect(getEmojiCodeByReactionType(reactionOptions, 'like')).toBe(undefined);
  });
});

describe('mapEmojiMartData', () => {
  it('stores the unicode code point on each mapped entry', () => {
    const mapped = mapEmojiMartData({
      emojis: {
        joy: { name: 'Joy', skins: [{ native: '😂' }] },
      },
    });

    const unicode = emojiToUnicode('😂');
    expect(mapped[unicode].unicode).toBe(unicode);
    expect(mapped[unicode].name).toBe('Joy');
  });
});
