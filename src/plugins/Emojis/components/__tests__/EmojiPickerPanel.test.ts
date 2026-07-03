import { themeClassName } from '../EmojiPickerPanel';

// The picker's theme CSS keys off the class this maps to: a forced `light`/`dark`
// must emit an SDK theme class on the panel root so the forced-light variable override
// in EmojiPicker.scss can win over an ancestor `.str-chat__theme-dark`. If these strings
// or the mapping drift, forced theming silently stops overriding the ancestor theme.
describe('themeClassName', () => {
  it('maps a forced theme to the matching SDK theme class', () => {
    expect(themeClassName('light')).toBe('str-chat__theme-light');
    expect(themeClassName('dark')).toBe('str-chat__theme-dark');
  });

  it('emits no class for auto/undefined so the panel inherits the ancestor theme', () => {
    expect(themeClassName('auto')).toBeUndefined();
    expect(themeClassName(undefined)).toBeUndefined();
  });
});
