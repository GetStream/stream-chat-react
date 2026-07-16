import type { MouseEventHandler, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

// Mock emoji-mart's Picker so jsdom doesn't render the real web component.
vi.mock('@emoji-mart/react', () => ({
  default: ({ onEmojiSelect }: { onEmojiSelect: (e: { native: string }) => void }) => (
    <div data-testid='em-picker'>
      <button onClick={() => onEmojiSelect({ native: '🚀' })} type='button'>
        pick
      </button>
    </div>
  ),
}));
vi.mock('@emoji-mart/data', () => ({ default: {} }));

const { textareaRef } = vi.hoisted(() => ({
  textareaRef: {
    current: document.createElement('textarea') as HTMLTextAreaElement | null,
  },
}));
const insertText = vi.hoisted(() => vi.fn());

vi.mock('../../../context', () => ({
  useMessageComposerContext: () => ({ textareaRef }),
  useTranslationContext: () => ({ t: (key: string) => key }),
}));
vi.mock('../../../components', async () => {
  const { forwardRef } = await import('react');
  return {
    Button: forwardRef<HTMLButtonElement, Record<string, unknown>>(
      function Button(props, ref) {
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
    useMessageComposerController: () => ({ textComposer: { insertText } }),
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

import { EmojiPicker } from '../EmojiPicker';

describe('EmojiPicker (deprecated emoji-mart)', () => {
  it('warns once about deprecation, naming the successor', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { unmount } = render(<EmojiPicker />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/deprecated/i);
    expect(warn.mock.calls[0][0]).toMatch(/StreamEmojiPicker/);
    expect(warn.mock.calls[0][0]).toMatch(/next major version/i);
    unmount();

    warn.mockClear();
    render(<EmojiPicker />); // module-level flag → no second warning
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('renders emoji-mart Picker when opened and inserts the chosen emoji', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<EmojiPicker />);
    fireEvent.click(screen.getByLabelText('aria/Emoji picker'));
    expect(screen.getByTestId('em-picker')).toBeInTheDocument();
    fireEvent.click(screen.getByText('pick'));
    expect(insertText).toHaveBeenCalledWith({ text: '🚀' });
  });
});
