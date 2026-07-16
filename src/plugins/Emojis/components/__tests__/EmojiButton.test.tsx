import { useMemo, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmojiButton } from '../EmojiButton';
import {
  type EmojiPickerContextValue,
  EmojiPickerProvider,
} from '../../context/EmojiPickerContext';
import { EmojiPickerCellProvider } from '../../context/EmojiPickerCellContext';
import { EmojiPickerPreviewProvider } from '../../context/EmojiPickerPreviewContext';

type Emoji = { skins: { native: string }[] };

const emoji = (id: string, native: string, name = id) => ({
  id,
  keywords: [],
  name,
  skins: [{ native, unified: '' }],
  version: 1,
});

const STABLE_EMOJI = emoji('grinning', '😀', 'Grinning');
const selectEmoji = vi.fn();
// Called once per EmojiButton render (in its body via resolveNative), so its call count
// is a render counter that survives the resolveNative reference changing (skin tone).
const renderProbe = vi.fn();
const countingResolveNative = (e: Emoji) => {
  renderProbe();
  return e.skins[0]?.native ?? '';
};

const previewValue = { previewedEmoji: null, setPreviewedEmoji: vi.fn() };

const baseMain = (activeCategoryId: string): EmojiPickerContextValue => ({
  activeCategoryId,
  categories: [],
  isSearching: false,
  query: '',
  requestScrollToCategory: vi.fn(),
  resolveNative: countingResolveNative,
  retry: vi.fn(),
  scrollTarget: null,
  searchResults: null,
  selectEmoji,
  setActiveCategory: vi.fn(),
  setQuery: vi.fn(),
  setSkinTone: vi.fn(),
  skinToneIndex: 0,
  skinTones: [],
  status: 'ready',
});

// `resolveNative`/`selectEmoji` live in BOTH the public context (custom grids) and the
// cell context (the default cell); a cell must subscribe to the cold cell context so hot
// state changes never reach it. `scroll-spy` mutates only hot public state; `skin-tone`
// bumps the tone the cell resolver closes over, changing its identity — mirroring Root,
// where resolveNative is a useCallback keyed on skinToneIndex.
function Harness() {
  const [hotCategory, setHotCategory] = useState('people');
  const [tone, setTone] = useState(0);
  const mainValue = useMemo(() => baseMain(hotCategory), [hotCategory]);
  const cellResolveNative = useMemo(
    () => (e: Emoji) => {
      renderProbe();
      return e.skins[tone]?.native ?? e.skins[0]?.native ?? '';
    },
    [tone],
  );
  const cellValue = useMemo(
    () => ({ resolveNative: cellResolveNative, selectEmoji }),
    [cellResolveNative],
  );

  return (
    <EmojiPickerProvider value={mainValue}>
      <EmojiPickerCellProvider value={cellValue}>
        <EmojiPickerPreviewProvider value={previewValue}>
          <button
            onClick={() => setHotCategory((c) => (c === 'people' ? 'flags' : 'people'))}
            type='button'
          >
            scroll-spy
          </button>
          <button onClick={() => setTone((v) => v + 1)} type='button'>
            skin-tone
          </button>
          <EmojiButton emoji={STABLE_EMOJI} />
        </EmojiPickerPreviewProvider>
      </EmojiPickerCellProvider>
    </EmojiPickerProvider>
  );
}

describe('EmojiButton context subscription', () => {
  beforeEach(() => {
    renderProbe.mockClear();
  });

  it('does not re-render when hot picker state (scroll-spy active category) changes', () => {
    render(<Harness />);
    const initial = renderProbe.mock.calls.length;
    expect(initial).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'scroll-spy' }));

    // The cell reads none of the hot fields, so a scroll-spy update must not re-render it.
    expect(renderProbe).toHaveBeenCalledTimes(initial);
  });

  it('re-renders when the resolved glyph changes (skin tone)', () => {
    render(<Harness />);
    const initial = renderProbe.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'skin-tone' }));

    expect(renderProbe.mock.calls.length).toBeGreaterThan(initial);
  });
});
