import { render, screen } from '@testing-library/react';

vi.mock('../../../../context', () => ({
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

import { PreviewPane } from '../PreviewPane';
import { EmojiPickerProvider } from '../../context/EmojiPickerContext';
import type { EmojiDataEmoji } from '../../data';

const smile: EmojiDataEmoji = {
  id: 'smile',
  keywords: ['happy'],
  name: 'Smiling Face',
  skins: [{ native: '😄', unified: '1f604' }],
  version: 1,
};

const renderPreview = (emoji: EmojiDataEmoji | null, skinToneIndex = 0) =>
  render(
    <EmojiPickerProvider
      value={{ onSelectEmoji: vi.fn(), setPreviewedEmoji: vi.fn(), skinToneIndex }}
    >
      <PreviewPane emoji={emoji} />
    </EmojiPickerProvider>,
  );

describe('PreviewPane', () => {
  it('shows the emoji name and its shortcode when an emoji is previewed', () => {
    renderPreview(smile);

    expect(screen.getByText('Smiling Face')).toBeInTheDocument();
    // The shortcode (`:id:`) must be visible so users learn the autocomplete token.
    expect(screen.getByText(':smile:')).toBeInTheDocument();
  });

  it('shows the placeholder and no shortcode when nothing is previewed', () => {
    renderPreview(null);

    expect(screen.getByText('Pick an emoji…')).toBeInTheDocument();
    expect(screen.queryByText(/^:.+:$/)).not.toBeInTheDocument();
  });
});
