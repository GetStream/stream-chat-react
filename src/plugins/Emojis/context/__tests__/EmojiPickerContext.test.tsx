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

const DATA = {
  aliases: {},
  categories: [{ emojis: ['grinning'], id: 'people' }],
  emojis: {
    grinning: {
      id: 'grinning',
      keywords: [],
      name: 'Grinning',
      skins: [{ native: '😀', unified: '1f600' }],
      version: 1,
    },
  },
};

function Probe() {
  const ctx = useEmojiPickerContext();
  return (
    <>
      <span data-testid='status'>{ctx.status}</span>
      <span data-testid='cats'>{ctx.categories.map((c) => c.id).join(',')}</span>
      <span data-testid='tones'>{ctx.skinTones.length}</span>
      <span data-testid='native'>{ctx.resolveNative(ctx.categories[0].emojis[0])}</span>
    </>
  );
}

describe('EmojiPickerRoot context', () => {
  beforeEach(() => {
    hookState.data = DATA;
    hookState.error = false;
  });

  it('exposes the full contract to slot consumers', () => {
    render(
      <EmojiPickerRoot onEmojiSelect={() => {}}>
        <Probe />
      </EmojiPickerRoot>,
    );
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('cats')).toHaveTextContent('people');
    expect(screen.getByTestId('tones')).toHaveTextContent('6');
    expect(screen.getByTestId('native')).toHaveTextContent('😀');
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
