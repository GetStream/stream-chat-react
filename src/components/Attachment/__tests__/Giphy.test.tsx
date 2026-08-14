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
    t: (key: string, second?: unknown, third?: unknown) => {
      const defaultValue = typeof second === 'string' ? second : undefined;
      const options = ((typeof second === 'object' ? second : third) ?? {}) as Record<
        string,
        unknown
      >;
      let template = defaultValue;
      if (template === undefined && typeof options.count === 'number') {
        template = (
          options.count === 1 ? options.defaultValue_one : options.defaultValue_other
        ) as string | undefined;
      }
      template ??= options.defaultValue as string | undefined;
      template ??= key;
      return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, name: string) => {
        const value = options[name];
        return value === undefined || value === null ? whole : String(value);
      });
    },
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
