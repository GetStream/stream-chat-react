import {
  DEFAULT_EMOJI_PICKER_OPTIONS,
  resolveEmojiPickerOptions,
  warnUnsupportedPickerProps,
} from '../options';

describe('resolveEmojiPickerOptions', () => {
  it('returns the documented defaults when nothing is passed', () => {
    expect(resolveEmojiPickerOptions()).toEqual(DEFAULT_EMOJI_PICKER_OPTIONS);
    expect(DEFAULT_EMOJI_PICKER_OPTIONS.autoFocus).toBe(true);
    expect(DEFAULT_EMOJI_PICKER_OPTIONS.perLine).toBe(9);
    expect(DEFAULT_EMOJI_PICKER_OPTIONS.maxFrequentRows).toBe(1);
    expect(DEFAULT_EMOJI_PICKER_OPTIONS.navPosition).toBe('top');
  });

  it('overrides only the provided keys and clamps perLine/maxFrequentRows', () => {
    const resolved = resolveEmojiPickerOptions({
      maxFrequentRows: -3,
      navPosition: 'bottom',
      perLine: 0,
    });
    expect(resolved.navPosition).toBe('bottom');
    expect(resolved.perLine).toBe(1); // clamped to >= 1
    expect(resolved.maxFrequentRows).toBe(0); // clamped to >= 0
    expect(resolved.previewPosition).toBe('bottom'); // untouched default
  });
});

describe('warnUnsupportedPickerProps', () => {
  it('warns about emoji-mart-only keys but not supported ones', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnUnsupportedPickerProps({ perLine: 9, set: 'apple', theme: 'dark' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('set'));
    expect(warn.mock.calls[0][0]).not.toContain('perLine');
    warn.mockRestore();
  });

  it('points styling knobs at the CSS token instead of ignoring them', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnUnsupportedPickerProps({ emojiSize: 20 });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('--str-chat__emoji-picker-emoji-size'),
    );
    warn.mockRestore();
  });
});
