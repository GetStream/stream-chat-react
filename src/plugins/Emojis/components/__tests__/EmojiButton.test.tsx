import { render, screen } from '@testing-library/react';
import { EmojiButton } from '../EmojiButton';
import {
  type EmojiPickerContextValue,
  EmojiPickerProvider,
} from '../../context/EmojiPickerContext';
import { EmojiPickerPreviewProvider } from '../../context/EmojiPickerPreviewContext';
import { SKIN_TONES } from '../skinTones';
import type { EmojiDataEmoji } from '../../data';

// A skin-tone-capable emoji (6 skins) and a plain one (1 skin) — mirrors the dataset,
// where only ~305 of ~1870 emoji have skin variants.
const wave: EmojiDataEmoji = {
  id: 'wave',
  keywords: ['hand'],
  name: 'Waving Hand',
  skins: [
    { native: '👋', unified: '1f44b' },
    { native: '👋🏻', unified: '1f44b-1f3fb' },
    { native: '👋🏼', unified: '1f44b-1f3fc' },
    { native: '👋🏽', unified: '1f44b-1f3fd' },
    { native: '👋🏾', unified: '1f44b-1f3fe' },
    { native: '👋🏿', unified: '1f44b-1f3ff' },
  ],
  version: 1,
};

const grinning: EmojiDataEmoji = {
  id: 'grinning',
  keywords: ['face'],
  name: 'Grinning',
  skins: [{ native: '😀', unified: '1f600' }],
  version: 1,
};

// The cell renders `resolveNative(emoji)` from context; mirror the real skin-tone
// resolution so the per-tone assertions still exercise the contract.
const makeContext = (skinToneIndex: number): EmojiPickerContextValue => ({
  activeCategoryId: '',
  categories: [],
  isSearching: false,
  query: '',
  requestScrollToCategory: vi.fn(),
  resolveNative: (emoji) =>
    emoji.skins[skinToneIndex]?.native ?? emoji.skins[0]?.native ?? '',
  retry: vi.fn(),
  scrollTarget: null,
  searchResults: null,
  selectEmoji: vi.fn(),
  setActiveCategory: vi.fn(),
  setQuery: vi.fn(),
  setSkinTone: vi.fn(),
  skinToneIndex,
  skinTones: SKIN_TONES,
  status: 'ready',
});

const wrap = (emoji: EmojiDataEmoji, skinToneIndex: number) => (
  <EmojiPickerProvider value={makeContext(skinToneIndex)}>
    <EmojiPickerPreviewProvider
      value={{ previewedEmoji: null, setPreviewedEmoji: vi.fn() }}
    >
      <EmojiButton emoji={emoji} />
    </EmojiPickerPreviewProvider>
  </EmojiPickerProvider>
);

const renderButton = (emoji: EmojiDataEmoji, skinToneIndex: number) =>
  render(wrap(emoji, skinToneIndex));

describe('EmojiButton skin tone', () => {
  it('renders the default glyph at skin tone 0', () => {
    renderButton(wave, 0);
    expect(screen.getByRole('button', { name: 'Waving Hand' })).toHaveTextContent('👋');
  });

  it('renders the toned glyph for a skin-tone-capable emoji', () => {
    renderButton(wave, 5);
    expect(screen.getByRole('button', { name: 'Waving Hand' })).toHaveTextContent('👋🏿');
  });

  it('updates the glyph when the active skin tone changes (memo does not block context)', () => {
    const { rerender } = renderButton(wave, 0);
    expect(screen.getByRole('button', { name: 'Waving Hand' })).toHaveTextContent('👋');

    rerender(wrap(wave, 3));
    expect(screen.getByRole('button', { name: 'Waving Hand' })).toHaveTextContent('👋🏽');
  });

  it('leaves an emoji with no skin variants unchanged at any tone (why smileys never change)', () => {
    renderButton(grinning, 5);
    // Falls back to skins[0] — this is why changing skin tone has no visible effect on
    // the faces shown by default; only hand/person emoji carry skin variants.
    expect(screen.getByRole('button', { name: 'Grinning' })).toHaveTextContent('😀');
  });
});
