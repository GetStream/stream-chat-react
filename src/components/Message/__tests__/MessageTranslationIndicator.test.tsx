import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import type { StreamChat } from 'stream-chat';

import { ChatProvider, MessageProvider, TranslationProvider } from '../../../context';
import { Streami18n } from '../../../i18n/Streami18n';
import {
  generatePoll,
  getTestClientWithUser,
  mockChatContext,
  mockMessageContext,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { MessageTranslationIndicator } from '../MessageTranslationIndicator';

describe('MessageTranslationIndicator', () => {
  describe('poll messages', () => {
    let client: StreamChat;

    beforeEach(async () => {
      client = await getTestClientWithUser();
    });

    const pollMessage = {
      poll: {
        latest_answers: [],
        name: 'Favourite fruit?',
        name_i18n: { es_text: '¿Fruta favorita?', language: 'en' },
        options: [{ id: 'apples', text: 'Apples', text_i18n: { es_text: 'Manzanas' } }],
      },
      text: '',
      type: 'regular',
    };

    // Rendered against a real `Streami18n`, so "Translated from English" comes from the `language/en`
    // entry rather than a mocked `t`.
    const renderIndicator = async ({
      message = pollMessage,
      setTranslationView = vi.fn(),
      userLanguage,
    }: {
      message?: Record<string, unknown>;
      setTranslationView?: ReturnType<typeof vi.fn>;
      userLanguage: string;
    }) => {
      const i18n = new Streami18n({ logger: () => {} });
      const { t, tDateTimeParser } = await i18n.getTranslators();
      render(
        <ChatProvider value={mockChatContext({ client })}>
          <TranslationProvider
            value={mockTranslationContextValue({ t, tDateTimeParser, userLanguage })}
          >
            <MessageProvider
              value={mockMessageContext({
                message,
                setTranslationView,
                translationView: 'translated',
              })}
            >
              <MessageTranslationIndicator />
            </MessageProvider>
          </TranslationProvider>
        </ChatProvider>,
      );
      return setTranslationView;
    };

    it('renders for a poll-only message whose poll is translated', async () => {
      await renderIndicator({ userLanguage: 'es' });
      expect(screen.getByText('Translated from English')).toBeInTheDocument();
    });

    it('switches the message (and so its poll) to the original', async () => {
      const setTranslationView = await renderIndicator({ userLanguage: 'es' });
      fireEvent.click(screen.getByText('View original'));
      expect(setTranslationView).toHaveBeenCalledWith('original');
    });

    it('stays hidden when the poll has no translation for the user language', async () => {
      await renderIndicator({ userLanguage: 'de' });
      expect(screen.queryByText(/Translated/)).not.toBeInTheDocument();
    });

    // The poll renders from its live state; `message.poll` is the snapshot it was loaded with and is
    // never updated by poll events.
    it('appears when a poll.updated event brings translations after the first render', async () => {
      client.polls.registerSubscriptions();
      const pollData = generatePoll({
        id: 'live-poll',
        latest_answers: [],
        name: 'Favourite fruit?',
        name_i18n: undefined,
        options: [{ id: 'apples', text: 'Apples' }],
      });
      const message = {
        id: 'm-live',
        poll: pollData,
        poll_id: pollData.id,
        text: '',
        type: 'regular',
      };
      client.polls.hydratePollCache([message as never]);

      await renderIndicator({ message, userLanguage: 'es' });
      expect(screen.queryByText(/Translated/)).not.toBeInTheDocument();

      act(() => {
        client.dispatchEvent({
          created_at: new Date().toISOString(),
          poll: {
            ...pollData,
            options: [
              {
                id: 'apples',
                text: 'Apples',
                text_i18n: { es_text: 'Manzanas', language: 'en' },
              },
            ],
          },
          type: 'poll.updated',
        } as never);
      });

      expect(screen.getByText('Translated from English')).toBeInTheDocument();
    });
  });
});
