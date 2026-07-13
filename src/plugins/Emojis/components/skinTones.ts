// Skin-tone swatches for the picker. Index 0 is the default (no modifier); 1–5 are
// light → dark. The glyph is a hand emoji carrying the matching Fitzpatrick skin
// tone modifier, mirroring emoji-mart's selector. `labelKey` is translated via t().
export type SkinTone = { glyph: string; labelKey: string };

export const SKIN_TONES: SkinTone[] = [
  { glyph: '✋', labelKey: 'Default' },
  { glyph: '✋🏻', labelKey: 'Light' },
  { glyph: '✋🏼', labelKey: 'Medium-Light' },
  { glyph: '✋🏽', labelKey: 'Medium' },
  { glyph: '✋🏾', labelKey: 'Medium-Dark' },
  { glyph: '✋🏿', labelKey: 'Dark' },
];

export const MAX_SKIN_TONE_INDEX = SKIN_TONES.length - 1;
