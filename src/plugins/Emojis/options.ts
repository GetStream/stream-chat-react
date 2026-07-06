import type { CSSProperties } from 'react';

export type EmojiPickerNavPosition = 'top' | 'bottom' | 'none';
export type EmojiPickerPreviewPosition = 'top' | 'bottom' | 'none';
export type EmojiPickerSearchPosition = 'sticky' | 'static' | 'none';
export type EmojiPickerSkinTonePosition = 'preview' | 'search' | 'none';

export type EmojiPickerPassthroughProps = {
  /** Focus the search input when the picker opens (default `true`). */
  autoFocus?: boolean;
  /** Category ids to show, in order. Defaults to the dataset order. `frequent` always prepends. */
  categories?: string[];
  /** Hide emoji introduced after this Unicode emoji version. */
  emojiVersion?: number;
  /** Emoji ids to exclude from the grid and search. */
  exceptEmojis?: string[];
  /** Max rows in the "frequently used" section (default `1`). */
  maxFrequentRows?: number;
  /** Category navigation placement (default `'top'`). */
  navPosition?: EmojiPickerNavPosition;
  /** Hide country-flag emoji (default `false`). */
  noCountryFlags?: boolean;
  /** Emoji id shown in the empty-search state. */
  noResultsEmoji?: string;
  /** Called when a pointer press lands outside the picker. */
  onClickOutside?: () => void;
  /** Emoji per row (default `9`). */
  perLine?: number;
  /** Emoji id shown in the preview when nothing is hovered/focused. */
  previewEmoji?: string;
  /** Preview placement (default `'bottom'`). */
  previewPosition?: EmojiPickerPreviewPosition;
  /** Search input placement (default `'sticky'`). */
  searchPosition?: EmojiPickerSearchPosition;
  /** Skin-tone selector placement (default `'preview'`). */
  skinTonePosition?: EmojiPickerSkinTonePosition;
  /** Inline styles applied to the picker panel root. */
  style?: CSSProperties;
  /** Color theme. 'auto' (default) inherits the ancestor SDK theme; 'light'/'dark' force it. */
  theme?: 'auto' | 'light' | 'dark';
};

export type ResolvedEmojiPickerOptions = {
  autoFocus: boolean;
  categories?: string[];
  emojiVersion?: number;
  exceptEmojis: string[];
  maxFrequentRows: number;
  navPosition: EmojiPickerNavPosition;
  noCountryFlags: boolean;
  noResultsEmoji?: string;
  perLine: number;
  previewEmoji?: string;
  previewPosition: EmojiPickerPreviewPosition;
  searchPosition: EmojiPickerSearchPosition;
  skinTonePosition: EmojiPickerSkinTonePosition;
};

export const DEFAULT_EMOJI_PICKER_OPTIONS: ResolvedEmojiPickerOptions = {
  autoFocus: true,
  exceptEmojis: [],
  maxFrequentRows: 1,
  navPosition: 'top',
  noCountryFlags: false,
  perLine: 9,
  previewPosition: 'bottom',
  searchPosition: 'sticky',
  skinTonePosition: 'preview',
};

export const resolveEmojiPickerOptions = (
  pickerProps?: EmojiPickerPassthroughProps,
): ResolvedEmojiPickerOptions => {
  const p = pickerProps ?? {};
  const d = DEFAULT_EMOJI_PICKER_OPTIONS;
  return {
    autoFocus: p.autoFocus ?? d.autoFocus,
    categories: p.categories,
    emojiVersion: p.emojiVersion,
    exceptEmojis: p.exceptEmojis ?? d.exceptEmojis,
    maxFrequentRows: Math.max(0, Math.floor(p.maxFrequentRows ?? d.maxFrequentRows)),
    navPosition: p.navPosition ?? d.navPosition,
    noCountryFlags: p.noCountryFlags ?? d.noCountryFlags,
    noResultsEmoji: p.noResultsEmoji,
    perLine: Math.max(1, Math.floor(p.perLine ?? d.perLine)),
    previewEmoji: p.previewEmoji,
    previewPosition: p.previewPosition ?? d.previewPosition,
    searchPosition: p.searchPosition ?? d.searchPosition,
    skinTonePosition: p.skinTonePosition ?? d.skinTonePosition,
  };
};

const SUPPORTED_PICKER_PROP_KEYS = [
  'autoFocus',
  'categories',
  'emojiVersion',
  'exceptEmojis',
  'maxFrequentRows',
  'navPosition',
  'noCountryFlags',
  'noResultsEmoji',
  'onClickOutside',
  'perLine',
  'previewEmoji',
  'previewPosition',
  'searchPosition',
  'skinTonePosition',
  'style',
  'theme',
];

/** emoji-mart styling knobs → the CSS token that replaces each. */
const STYLING_KNOB_TOKENS: Record<string, string> = {
  emojiButtonColors: '--str-chat__emoji-picker-hover-background-color',
  emojiButtonRadius: '--str-chat__radius-4 (on .str-chat__emoji-picker__emoji)',
  emojiButtonSize: '--str-chat__emoji-picker-emoji-size',
  emojiSize: '--str-chat__emoji-picker-emoji-size',
};

export const warnUnsupportedPickerProps = (
  pickerProps?: Record<string, unknown>,
): void => {
  if (!pickerProps) return;
  const keys = Object.keys(pickerProps);
  const styling = keys.filter((key) => key in STYLING_KNOB_TOKENS);
  const ignored = keys.filter(
    (key) => !SUPPORTED_PICKER_PROP_KEYS.includes(key) && !(key in STYLING_KNOB_TOKENS),
  );
  if (styling.length) {
    console.warn(
      `[stream-chat-react] EmojiPicker: ${styling.join(', ')} are emoji-mart styling props. ` +
        `Use the matching CSS token instead (e.g. ${STYLING_KNOB_TOKENS[styling[0]]}).`,
    );
  }
  if (ignored.length) {
    console.warn(
      `[stream-chat-react] EmojiPicker ignored unsupported pickerProps: ${ignored.join(', ')}. ` +
        'These emoji-mart Picker options are not available in the built-in picker.',
    );
  }
};
