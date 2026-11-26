import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { EmojiPicker } from '../EmojiPicker';

vi.mock('../Picker', () => ({
  Picker: () => <div data-testid='picker' />,
}));

vi.mock('../../../context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../context')>()),
  useComponentContextIcons: () => ({ IconEmoji: () => null }),
  useMessageComposerContext: () => ({ textareaRef: { current: null } }),
  useTranslationContext: () => ({ t: (_key: string, value: string) => value }),
}));

vi.mock('../../../components', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../components')>()),
  useMessageComposerController: () => ({ textComposer: { insertText: vi.fn() } }),
}));

vi.mock('../../../components/MessageComposer/hooks/useIsCooldownActive', () => ({
  useIsCooldownActive: () => false,
}));

describe('EmojiPicker', () => {
  it('caps the picker to the space available', async () => {
    render(<EmojiPicker />);

    await act(() => {
      screen.getByRole('button', { name: 'Emoji picker' }).click();
    });

    const container = screen.getByTestId('picker').parentElement as HTMLElement;
    await waitFor(() => {
      expect(container.style.maxHeight).toMatch(/^\d+(\.\d+)?px$/);
    });
  });
});
