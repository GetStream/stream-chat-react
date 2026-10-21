import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ChatProvider, MessageProvider, TranslationProvider } from '../../../context';
import { Streami18n } from '../../../i18n/Streami18n';
import type { StreamTFunction } from '../../../i18n/types';
import {
  convertDateToTimestamp,
  generatePoll,
  getTestClientWithUser,
  mockChatContext,
  mockMessageContext,
} from '../../../mock-builders';
import { MessageTranslationIndicator } from '../MessageTranslationIndicator';

/**
 * Rendered against a real `Streami18n`, not a mocked `t`.
 *
 * The behaviour under test is what i18next does with a `language.*` key it has no entry for, so a mock
 * that echoes the default back would pass either way.
 */
const renderIndicator = async (sourceLanguage: string) => {
  const i18n = new Streami18n({ logger: () => {} });
  const { t, tDateTimeParser } = await i18n.init();

  const message = {
    i18n: { en_text: 'Hello', language: sourceLanguage },
    text: 'source text',
    type: 'regular',
  };

  render(
    <TranslationProvider
      value={{ t: t as StreamTFunction, tDateTimeParser, userLanguage: 'en' }}
    >
      <MessageProvider
        value={mockMessageContext({
          message,
          setTranslationView: () => {},
          translationView: 'translated',
        })}
      >
        <MessageTranslationIndicator />
      </MessageProvider>
    </TranslationProvider>,
  );
};

describe('MessageTranslationIndicator', () => {
  it('names a language core has a display name for', async () => {
    await renderIndicator('de');

    expect(screen.getByText('Translated from German')).toBeInTheDocument();
  });

  /**
   * `message.i18n.language` is server data; the `language.*` catalog is generated when the SDK is built.
   * A language the translation API learns after this release therefore has no entry, and i18next echoes
   * the key back — so without the miss-detection this rendered "Translated from language.xx".
   */
  it('falls back to the bare code for a language it has no name for', async () => {
    await renderIndicator('xx');

    expect(screen.getByText('Translated from xx')).toBeInTheDocument();
    expect(screen.queryByText(/language\.xx/)).not.toBeInTheDocument();
  });

  describe('poll messages', () => {
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

    const renderPollIndicator = async (
      userLanguage: string,
      setTranslationView = vi.fn(),
    ) => {
      const i18n = new Streami18n({ logger: () => {} });
      const { t, tDateTimeParser } = await i18n.init();
      render(
        <TranslationProvider
          value={{ t: t as StreamTFunction, tDateTimeParser, userLanguage }}
        >
          <MessageProvider
            value={mockMessageContext({
              message: pollMessage,
              setTranslationView,
              translationView: 'translated',
            })}
          >
            <MessageTranslationIndicator />
          </MessageProvider>
        </TranslationProvider>,
      );
      return setTranslationView;
    };

    it('renders for a poll-only message whose poll is translated', async () => {
      await renderPollIndicator('es');
      expect(screen.getByText('Translated from English')).toBeInTheDocument();
    });

    it('switches the message (and so its poll) to the original', async () => {
      const setTranslationView = await renderPollIndicator('es');
      fireEvent.click(screen.getByText('View original'));
      expect(setTranslationView).toHaveBeenCalledWith('original');
    });

    it('stays hidden when the poll has no translation for the user language', async () => {
      await renderPollIndicator('de');
      expect(screen.queryByText(/Translated/)).not.toBeInTheDocument();
    });

    // The poll renders from its live state; `message.poll` is the snapshot it was loaded with and is
    // never updated by poll events.
    it('appears when a poll.updated event brings translations after the first render', async () => {
      const client = await getTestClientWithUser();
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

      const i18n = new Streami18n({ logger: () => {} });
      const { t, tDateTimeParser } = await i18n.init();
      render(
        <ChatProvider value={mockChatContext({ client })}>
          <TranslationProvider
            value={{ t: t as StreamTFunction, tDateTimeParser, userLanguage: 'es' }}
          >
            <MessageProvider
              value={mockMessageContext({
                message,
                setTranslationView: vi.fn(),
                translationView: 'translated',
              })}
            >
              <MessageTranslationIndicator />
            </MessageProvider>
          </TranslationProvider>
        </ChatProvider>,
      );
      expect(screen.queryByText(/Translated/)).not.toBeInTheDocument();

      act(() => {
        client.dispatchEvent({
          created_at: convertDateToTimestamp(),
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
