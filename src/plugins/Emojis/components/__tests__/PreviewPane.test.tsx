import { render, screen } from '@testing-library/react';

vi.mock('../../../../context', () => ({
  useTranslationContext: () => ({ t: (key: string) => key }),
}));
vi.mock('../../context/EmojiPickerContext', () => ({
  useEmojiPickerContext: () => ({
    resolveNative: (emoji: { skins: { native: string }[] }) =>
      emoji.skins[0]?.native ?? '',
  }),
}));

const { preview } = vi.hoisted(() => ({
  preview: {
    previewedEmoji: null as null | {
      id: string;
      name: string;
      skins: { native: string }[];
    },
    setPreviewedEmoji: vi.fn(),
  },
}));
vi.mock('../../context/EmojiPickerPreviewContext', () => ({
  useEmojiPickerPreviewContext: () => preview,
}));

import { PreviewPane } from '../PreviewPane';

const smile = {
  id: 'smile',
  keywords: ['happy'],
  name: 'Smiling Face',
  skins: [{ native: '😄', unified: '1f604' }],
  version: 1,
};

describe('PreviewPane', () => {
  it('shows the emoji name and its shortcode when an emoji is previewed', () => {
    preview.previewedEmoji = smile;
    render(<PreviewPane />);

    expect(screen.getByText('Smiling Face')).toBeInTheDocument();
    // The shortcode (`:id:`) must be visible so users learn the autocomplete token.
    expect(screen.getByText(':smile:')).toBeInTheDocument();
  });

  it('shows the placeholder and no shortcode when nothing is previewed', () => {
    preview.previewedEmoji = null;
    render(<PreviewPane />);

    expect(screen.getByText('Pick an emoji…')).toBeInTheDocument();
    expect(screen.queryByText(/^:.+:$/)).not.toBeInTheDocument();
  });
});
