import { fireEvent, render, screen } from '@testing-library/react';

const { hookState } = vi.hoisted(() => ({
  hookState: { data: null as unknown, error: false, retry: vi.fn() },
}));
vi.mock('../../hooks/useEmojiPickerState', () => ({
  useEmojiPickerState: () => hookState,
}));
vi.mock('../../../../context', () => ({
  useTranslationContext: () => ({ t: (k: string) => k }),
}));

import { EmojiPickerRoot } from '../../components/EmojiPickerRoot';
import { useEmojiPickerContext } from '../EmojiPickerContext';

// `grinning` has no skin variants; `wave` has all six, so resolveNative can be exercised
// across tones (this is where the skin-tone resolution lives now, not in EmojiButton).
const DATA = {
  aliases: {},
  categories: [{ emojis: ['grinning', 'wave'], id: 'people' }],
  emojis: {
    grinning: {
      id: 'grinning',
      keywords: [],
      name: 'Grinning',
      skins: [{ native: '😀', unified: '1f600' }],
      version: 1,
    },
    wave: {
      id: 'wave',
      keywords: [],
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
    },
  },
};

const ContractProbe = () => {
  const ctx = useEmojiPickerContext();
  return (
    <>
      <span data-testid='status'>{ctx.status}</span>
      <span data-testid='cats'>{ctx.categories.map((c) => c.id).join(',')}</span>
      <span data-testid='tones'>{ctx.skinTones.length}</span>
    </>
  );
};

const NativeProbe = () => {
  const { categories, resolveNative } = useEmojiPickerContext();
  return (
    <ul>
      {categories[0]?.emojis.map((e) => (
        <li data-testid={`native-${e.id}`} key={e.id}>
          {resolveNative(e)}
        </li>
      ))}
    </ul>
  );
};

describe('EmojiPickerRoot context', () => {
  beforeEach(() => {
    hookState.data = DATA;
    hookState.error = false;
  });

  it('exposes the full contract to slot consumers', () => {
    render(
      <EmojiPickerRoot onEmojiSelect={() => {}}>
        <ContractProbe />
      </EmojiPickerRoot>,
    );
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('cats')).toHaveTextContent('people');
    expect(screen.getByTestId('tones')).toHaveTextContent('6');
  });

  it('resolveNative returns the toned glyph for skin-capable emoji, the default otherwise', () => {
    render(
      <EmojiPickerRoot onEmojiSelect={() => {}} skinToneIndex={5}>
        <NativeProbe />
      </EmojiPickerRoot>,
    );
    expect(screen.getByTestId('native-wave')).toHaveTextContent('👋🏿');
    // No skin variants → falls back to skins[0] regardless of the active tone.
    expect(screen.getByTestId('native-grinning')).toHaveTextContent('😀');
  });

  it('closes on Escape from the dialog container', () => {
    const onClose = vi.fn();
    render(
      <EmojiPickerRoot onClose={onClose} onEmojiSelect={() => {}}>
        <span>slot</span>
      </EmojiPickerRoot>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
