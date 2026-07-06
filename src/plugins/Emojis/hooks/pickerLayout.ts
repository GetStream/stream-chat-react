import type { ResolvedEmojiPickerOptions } from '../options';

export type PickerLayout = {
  nav: 'top' | 'bottom' | null;
  preview: 'top' | 'bottom' | null;
  search: 'sticky' | 'static' | null;
  skinTone: 'search' | 'preview' | 'footer' | null;
};

/**
 * Pure resolver deciding where each picker region renders. `'none'` positions become
 * `null` (omit the region). The skin-tone selector normally lives with the search row
 * (`skinTonePosition: 'search'`) or the preview row (`'preview'`); when its host region
 * is hidden it falls back — to the preview row, then to a standalone footer — so the
 * selector never silently disappears when the integrator hides search or preview.
 */
export const resolvePickerLayout = ({
  navPosition,
  previewPosition,
  searchPosition,
  skinTonePosition,
}: Pick<
  ResolvedEmojiPickerOptions,
  'navPosition' | 'previewPosition' | 'searchPosition' | 'skinTonePosition'
>): PickerLayout => {
  const nav = navPosition === 'none' ? null : navPosition;
  const preview = previewPosition === 'none' ? null : previewPosition;
  const search = searchPosition === 'none' ? null : searchPosition;

  let skinTone: PickerLayout['skinTone'];
  if (skinTonePosition === 'none') {
    skinTone = null;
  } else if (skinTonePosition === 'search') {
    if (search) skinTone = 'search';
    else if (preview) skinTone = 'preview';
    else skinTone = 'footer';
  } else {
    skinTone = preview ? 'preview' : 'footer';
  }

  return { nav, preview, search, skinTone };
};
