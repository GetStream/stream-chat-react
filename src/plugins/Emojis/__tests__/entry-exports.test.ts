import * as emojis from '../index';

describe('emojis entry exports', () => {
  it('exports both the deprecated EmojiPicker and the StreamEmojiPicker successor', () => {
    expect(typeof emojis.EmojiPicker).toBe('function');
    expect(typeof emojis.StreamEmojiPicker).toBe('function');
  });
});
