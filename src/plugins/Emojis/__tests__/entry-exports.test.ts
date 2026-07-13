import * as emojis from '../index';
import { StreamEmojiPicker } from '../StreamEmojiPicker';

describe('emojis entry exports', () => {
  it('exports both the deprecated EmojiPicker and the StreamEmojiPicker successor', () => {
    expect(typeof emojis.EmojiPicker).toBe('function');
    expect(typeof emojis.StreamEmojiPicker).toBe('function');
  });

  it('exposes the compound API + context hook', () => {
    expect(typeof emojis.useEmojiPickerContext).toBe('function');
    for (const part of [
      'Grid',
      'Nav',
      'Preview',
      'Root',
      'Search',
      'SkinTone',
    ] as const) {
      expect(typeof StreamEmojiPicker[part]).toBe('function');
    }
  });
});
