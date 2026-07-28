import React from 'react';
import { render } from '@testing-library/react';

import { Giphy } from '../Giphy';
import { generateGiphyAttachment } from '../../../mock-builders';

const { channelStateMock } = vi.hoisted(() => ({
  channelStateMock: {
    giphyVersion: 'fixed_height',
    imageAttachmentSizeHandler: undefined,
  },
}));

vi.mock('../../../context', () => ({
  useChannelStateContext: () => channelStateMock,
  useComponentContext: () => ({}),
  useTranslationContext: () => ({
    t: (key, params) =>
      Object.keys(params ?? {}).reduce(
        (acc, paramKey) =>
          acc.replace(
            new RegExp(`\\{\\{\\s${paramKey}\\s\\}\\}`, 'g'),
            String(params?.[paramKey]),
          ),
        key.replace(/^aria\//, ''),
      ),
  }),
}));

describe('Giphy accessible name', () => {
  it('uses the giphy title as the image accessible name', () => {
    const attachment = generateGiphyAttachment({ title: 'dancing cat' });
    const { getByRole } = render(<Giphy attachment={attachment} />);
    expect(getByRole('img')).toHaveAccessibleName('Animated GIF: dancing cat');
  });

  it('falls back to a localized generic label when there is no title', () => {
    const attachment = generateGiphyAttachment({ title: undefined });
    const { getByRole } = render(<Giphy attachment={attachment} />);
    expect(getByRole('img')).toHaveAccessibleName('Animated GIF');
  });

  it('never exposes a raw URL as the accessible name', () => {
    // mimic a payload where the only "title" is a URL (the descriptor's URL fallback)
    const attachment = generateGiphyAttachment({
      thumb_url: 'https://media.giphy.com/media/abc/giphy.gif',
      title: undefined,
    });
    const { getByRole } = render(<Giphy attachment={attachment} />);
    const name = getByRole('img').getAttribute('alt');
    expect(name).not.toMatch(/https?:|\/\//);
    expect(name).toBe('Animated GIF');
  });
});
