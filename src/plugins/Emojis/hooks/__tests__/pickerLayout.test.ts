import { DEFAULT_EMOJI_PICKER_OPTIONS } from '../../options';
import { resolvePickerLayout } from '../pickerLayout';

const layout = (over: Partial<typeof DEFAULT_EMOJI_PICKER_OPTIONS> = {}) =>
  resolvePickerLayout({ ...DEFAULT_EMOJI_PICKER_OPTIONS, ...over });

describe('resolvePickerLayout', () => {
  it('maps the defaults (nav top, preview bottom, search sticky, skin in preview)', () => {
    expect(layout()).toEqual({
      nav: 'top',
      preview: 'bottom',
      search: 'sticky',
      skinTone: 'preview',
    });
  });

  it('maps `none` to null for each region', () => {
    expect(layout({ navPosition: 'none' }).nav).toBeNull();
    expect(layout({ previewPosition: 'none' }).preview).toBeNull();
    expect(layout({ searchPosition: 'none' }).search).toBeNull();
    expect(layout({ skinTonePosition: 'none' }).skinTone).toBeNull();
  });

  it('falls back skin-tone to the preview row when search is hidden', () => {
    expect(layout({ searchPosition: 'none', skinTonePosition: 'search' }).skinTone).toBe(
      'preview',
    );
  });

  it('falls back skin-tone to a standalone footer when preview is hidden', () => {
    expect(
      layout({ previewPosition: 'none', skinTonePosition: 'preview' }).skinTone,
    ).toBe('footer');
  });

  it('falls back to footer when both search and preview are hidden', () => {
    expect(
      layout({
        previewPosition: 'none',
        searchPosition: 'none',
        skinTonePosition: 'search',
      }).skinTone,
    ).toBe('footer');
  });
});
