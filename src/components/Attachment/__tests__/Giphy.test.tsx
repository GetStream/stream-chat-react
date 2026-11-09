import React from 'react';
import { render } from '@testing-library/react';

import { Giphy } from '../Giphy';
import { generateGiphyAttachment } from '../../../mock-builders';
import {
  AttachmentContextProvider,
  defaultAttachmentContextValue,
} from '../../../context/AttachmentContext';

vi.mock('../../../context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../context')>();
  return {
    useComponentContext: () => ({}),
    // The real hook: with no provider it returns the SDK icons, which is what these
    // assertions are written against.
    useComponentContextIcons: actual.useComponentContextIcons,
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
  };
});

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
    // Mimics a payload where the only "title" is a URL (the descriptor's URL fallback).
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

describe('Giphy version', () => {
  const renderWithVersion = (
    attachment: ReturnType<typeof generateGiphyAttachment>,
    contextValue: Partial<typeof defaultAttachmentContextValue> = {},
  ) =>
    render(
      <AttachmentContextProvider
        value={{ ...defaultAttachmentContextValue, ...contextValue }}
      >
        <Giphy attachment={attachment} />
      </AttachmentContextProvider>,
    );

  it('loads the image from the selected version', () => {
    const attachment = generateGiphyAttachment();
    const { getByRole } = renderWithVersion(attachment, { giphyVersion: 'original' });

    expect(getByRole('img')).toHaveAttribute('src', attachment.giphy!.original.url);
    expect(getByRole('img')).toHaveAttribute('width', '400');
  });

  it('loads the default version without a giphyVersion override', () => {
    const attachment = generateGiphyAttachment();
    const { getByRole } = render(<Giphy attachment={attachment} />);

    expect(getByRole('img')).toHaveAttribute('src', attachment.giphy!.fixed_height.url);
  });

  it('falls back to thumb_url when the selected version is missing', () => {
    const attachment = generateGiphyAttachment({
      giphy: { fixed_height: generateGiphyAttachment().giphy!.fixed_height },
      thumb_url: 'https://media.giphy.com/media/abc/thumb.gif',
    });
    const { getByRole } = renderWithVersion(attachment, { giphyVersion: 'original' });

    expect(getByRole('img')).toHaveAttribute(
      'src',
      'https://media.giphy.com/media/abc/thumb.gif',
    );
  });

  it('passes thumb_url to the size handler when the version is missing', () => {
    const attachment = generateGiphyAttachment({
      giphy: {},
      image_url: 'https://media.giphy.com/media/abc/image.gif',
      thumb_url: 'https://media.giphy.com/media/abc/thumb.gif',
    });
    const imageAttachmentSizeHandler = vi.fn(() => ({ url: '' }));
    renderWithVersion(attachment, {
      giphyVersion: 'original',
      imageAttachmentSizeHandler,
    });

    expect(imageAttachmentSizeHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        image_url: 'https://media.giphy.com/media/abc/thumb.gif',
      }),
      expect.any(HTMLElement),
    );
  });

  it('passes the selected version URL to the size handler', () => {
    const attachment = generateGiphyAttachment();
    const imageAttachmentSizeHandler = vi.fn((sizedAttachment) => ({
      url: `${sizedAttachment.image_url}&resized=1`,
    }));
    const { getByRole } = renderWithVersion(attachment, {
      giphyVersion: 'fixed_width_downsampled',
      imageAttachmentSizeHandler,
    });
    const versionUrl = attachment.giphy!.fixed_width_downsampled.url;

    expect(imageAttachmentSizeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ image_url: versionUrl }),
      expect.any(HTMLElement),
    );
    expect(getByRole('img')).toHaveAttribute('src', `${versionUrl}&resized=1`);
  });
});
