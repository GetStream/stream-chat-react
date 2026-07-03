import type { MouseEventHandler, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

// The panel is mounted only while the picker is open, so mock it to a controllable
// stub. This lets us assert that the owner (EmojiPicker) preserves skin tone and
// frequently-used across open/close — without depending on the real panel's
// virtualized grid + async data load, which don't render reliably in jsdom.
vi.mock('../components', () => ({
  EmojiPickerPanel: ({
    frequentlyUsedIds = [],
    onEmojiSelect,
    onSkinToneChange,
    skinToneIndex = 0,
  }: {
    frequentlyUsedIds?: string[];
    onEmojiSelect: (emoji: { id: string; name: string; native: string }) => void;
    onSkinToneChange?: (skinTone: number) => void;
    skinToneIndex?: number;
  }) => (
    <div data-testid='panel'>
      <span data-testid='skin-tone'>{skinToneIndex}</span>
      <span data-testid='frequently-used'>{frequentlyUsedIds.join(',')}</span>
      <button onClick={() => onSkinToneChange?.(4)} type='button'>
        set-skin
      </button>
      <button
        onClick={() => onEmojiSelect({ id: 'rocket', name: 'Rocket', native: '🚀' })}
        type='button'
      >
        select-rocket
      </button>
    </div>
  ),
}));

// Mutable so a test can simulate "no textarea to insert into" (textareaRef.current null).
const { textareaRef } = vi.hoisted(() => ({
  textareaRef: { current: null as HTMLTextAreaElement | null },
}));

vi.mock('../../../context', () => ({
  useMessageComposerContext: () => ({ textareaRef }),
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../components', async () => {
  const { forwardRef } = await import('react');
  return {
    Button: forwardRef<HTMLButtonElement, Record<string, unknown>>(
      function Button(props, ref) {
        // Forward only the DOM-valid props the test needs; styling props are dropped.
        return (
          <button
            aria-label={props['aria-label'] as string | undefined}
            onClick={props.onClick as MouseEventHandler<HTMLButtonElement> | undefined}
            ref={ref}
            type='button'
          >
            {props.children as ReactNode}
          </button>
        );
      },
    ),
    IconEmoji: () => <span>emoji</span>,
    useMessageComposerController: () => ({ textComposer: { insertText: vi.fn() } }),
  };
});

vi.mock('../../../components/Dialog/hooks/usePopoverPosition', () => ({
  usePopoverPosition: () => ({
    refs: { setFloating: vi.fn(), setReference: vi.fn() },
    strategy: 'absolute',
    x: 0,
    y: 0,
  }),
}));

vi.mock('../../../components/MessageComposer/hooks/useIsCooldownActive', () => ({
  useIsCooldownActive: () => false,
}));

// Imported after the mocks so the mocked dependencies are in place.
import { EmojiPicker } from '../EmojiPicker';

const openPicker = () => fireEvent.click(screen.getByLabelText('aria/Emoji picker'));

beforeEach(() => {
  textareaRef.current = document.createElement('textarea');
});

describe('EmojiPicker session state', () => {
  it('keeps skin tone and frequently-used across close and reopen (incl. closeOnEmojiSelect)', () => {
    render(<EmojiPicker closeOnEmojiSelect />);

    openPicker();
    expect(screen.getByTestId('skin-tone')).toHaveTextContent('0');
    expect(screen.getByTestId('frequently-used')).toHaveTextContent('');

    // Change skin tone, then select an emoji — selecting closes the picker.
    fireEvent.click(screen.getByText('set-skin'));
    expect(screen.getByTestId('skin-tone')).toHaveTextContent('4');
    fireEvent.click(screen.getByText('select-rocket'));

    // Panel (and any state it might have held) is unmounted.
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument();

    // Reopening shows the retained skin tone and the just-used emoji.
    openPicker();
    expect(screen.getByTestId('skin-tone')).toHaveTextContent('4');
    expect(screen.getByTestId('frequently-used')).toHaveTextContent('rocket');
  });

  it('does not record a frequently-used emoji when there is no textarea to insert into', () => {
    textareaRef.current = null;
    render(<EmojiPicker />);

    openPicker();
    expect(screen.getByTestId('frequently-used').textContent).toBe('');

    // Selecting can't insert (no textarea), so it must not be recorded as "used".
    fireEvent.click(screen.getByText('select-rocket'));
    expect(screen.getByTestId('frequently-used').textContent).toBe('');
  });
});

describe('EmojiPicker pickerProps', () => {
  it('warns about unsupported (emoji-mart) pickerProps, but not about theme/style', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { unmount } = render(
      <EmojiPicker
        // @ts-expect-error emoji-mart Picker options are not supported and must be rejected by the type
        pickerProps={{ perLine: 9, theme: 'dark' }}
      />,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('perLine'));
    unmount();

    warn.mockClear();
    render(<EmojiPicker pickerProps={{ style: { width: 320 }, theme: 'light' }} />);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});
