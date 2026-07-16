import * as emojis from '../index';
import { StreamEmojiPicker } from '../StreamEmojiPicker';

describe('emojis entry exports', () => {
  it('exports both pickers, the compound parts, and the context hook', () => {
    // Deprecated emoji-mart picker + its built-in successor.
    expect(typeof emojis.EmojiPicker).toBe('function');
    expect(typeof emojis.StreamEmojiPicker).toBe('function');
    // Composition surface.
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
