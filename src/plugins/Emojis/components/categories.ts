// Category metadata for the emoji picker navigation. We use representative native
// emoji glyphs for the nav tabs (avoids shipping ~8 additional SVG icon assets)
// plus an i18n label key per category. Keys match the vendored dataset's category
// ids, with `frequent` reserved for the synthetic "frequently used" section.
export const EMOJI_CATEGORY_META: Record<string, { glyph: string; labelKey: string }> = {
  activity: { glyph: '⚽', labelKey: 'Activities' },
  flags: { glyph: '🏁', labelKey: 'Flags' },
  foods: { glyph: '🍎', labelKey: 'Food & Drink' },
  frequent: { glyph: '🕐', labelKey: 'Frequently used' },
  nature: { glyph: '🌸', labelKey: 'Animals & Nature' },
  objects: { glyph: '💡', labelKey: 'Objects' },
  people: { glyph: '😀', labelKey: 'Smileys & People' },
  places: { glyph: '✈️', labelKey: 'Travel & Places' },
  symbols: { glyph: '🔣', labelKey: 'Symbols' },
};
