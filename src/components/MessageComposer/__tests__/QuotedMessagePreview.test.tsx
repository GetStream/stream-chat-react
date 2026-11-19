import React from 'react';
import { render, screen } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';

import { ChatProvider, TranslationProvider, WithComponents } from '../../../context';
import {
  generateImageAttachment,
  generateMessage,
  getTestClientWithUser,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { QuotedMessagePreviewUI } from '../QuotedMessagePreview';

let client: StreamChat;

beforeAll(async () => {
  client = await getTestClientWithUser({ id: 'current-user' });
});

describe('QuotedMessagePreviewUI', () => {
  it('renders the BaseImage from ComponentContext for an image quoted message', () => {
    const CustomBaseImage = ({ alt, src }: { alt?: string; src?: string }) => (
      <div data-alt={alt} data-src={src} data-testid='custom-base-image' />
    );
    const quotedMessage = generateMessage({
      attachments: [
        generateImageAttachment({
          fallback: 'photo.png',
          image_url: 'https://example.com/photo.png',
        }),
      ],
      text: '',
    });

    render(
      <ChatProvider value={mockChatContext({ client })}>
        <TranslationProvider value={mockTranslationContextValue()}>
          <WithComponents overrides={{ BaseImage: CustomBaseImage }}>
            <QuotedMessagePreviewUI quotedMessage={quotedMessage} />
          </WithComponents>
        </TranslationProvider>
      </ChatProvider>,
    );

    const image = screen.getByTestId('custom-base-image');
    expect(image).toHaveAttribute('data-src', 'https://example.com/photo.png');
    expect(image).toHaveAttribute('data-alt', 'photo.png');
    expect(screen.queryByTestId('str-chat__base-image')).not.toBeInTheDocument();
  });
});
