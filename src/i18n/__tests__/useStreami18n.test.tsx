import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat } from 'stream-chat';

import { useStreami18n } from '../useStreami18n';
import { Streami18n } from '../Streami18n';
import {
  TranslationProvider,
  useTranslationContext,
} from '../../context/TranslationContext';

/** A client whose `user.updated` listeners can be fired by hand. */
const mockClient = (language?: string) => {
  const listeners = new Set<(event: Event) => void>();
  const client = fromPartial<StreamChat>({
    on: (_type: string, handler: (event: Event) => void) => {
      listeners.add(handler);
      return { unsubscribe: () => listeners.delete(handler) };
    },
    user: { id: 'me', language },
  });

  return {
    client,
    /** Mutates `client.user` the way an event would, then notifies. */
    emitUserUpdated: (next?: string) => {
      (client.user as { language?: string }).language = next;
      listeners.forEach((handler) =>
        handler(fromPartial<Event>({ type: 'user.updated', user: { id: 'me' } })),
      );
    },
  };
};

const Readout = () => {
  const { userLanguage } = useTranslationContext();
  return <span data-testid='lang'>{userLanguage}</span>;
};

const Harness = ({
  client,
  i18nInstance,
}: {
  client: StreamChat;
  i18nInstance?: Streami18n;
}) => (
  <TranslationProvider value={useStreami18n({ client, i18nInstance })}>
    <Readout />
  </TranslationProvider>
);

describe('useStreami18n', () => {
  // `userLanguage` is the language the API auto-translates messages into, so it comes only from
  // `client.user.language`, never from registered dictionaries or the platform locale.
  describe('userLanguage', () => {
    it("takes the connected user's language", async () => {
      const { client } = mockClient('de');

      const { getByTestId } = render(<Harness client={client} />);

      await waitFor(() => expect(getByTestId('lang')).toHaveTextContent('de'));
    });

    it('falls back to English when the user has none', async () => {
      const { client } = mockClient();

      const { getByTestId } = render(<Harness client={client} />);

      await waitFor(() => expect(getByTestId('lang')).toHaveTextContent('en'));
    });

    // `client.user` is a plain field, so this needs a `user.updated` subscription.
    it('follows a language changed after connect', async () => {
      const { client, emitUserUpdated } = mockClient('de');
      const { getByTestId } = render(<Harness client={client} />);
      await waitFor(() => expect(getByTestId('lang')).toHaveTextContent('de'));

      emitUserUpdated('it');

      await waitFor(() => expect(getByTestId('lang')).toHaveTextContent('it'));
    });

    it('ignores the platform locale entirely', async () => {
      vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('de-DE');
      const { client } = mockClient();
      const i18nInstance = new Streami18n({ logger: () => null });
      i18nInstance.registerTranslation('de', { 'common.cancel.label': 'Abbrechen' });

      const { getByTestId } = render(
        <Harness client={client} i18nInstance={i18nInstance} />,
      );

      // A registered `de` dictionary is a UI-copy fact, not a message-translation one.
      await waitFor(() => expect(getByTestId('lang')).toHaveTextContent('en'));
    });
  });

  // The hook keeps a rejected `init()` from becoming an unhandled rejection.
  describe('a failed init()', () => {
    // `init()` is mocked instead of the i18next instance: core's suite covers why it rejects.
    const failing = () => {
      const i18nInstance = new Streami18n({ logger: () => null });
      vi.spyOn(i18nInstance, 'init').mockRejectedValue(new Error('i18next exploded'));
      return i18nInstance;
    };

    it('warns, with the error kept intact', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { client } = mockClient();

      render(<Harness client={client} i18nInstance={failing()} />);

      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith(
          'Streami18n failed to initialize',
          expect.objectContaining({ message: 'i18next exploded' }),
        ),
      );
      warn.mockRestore();
    });

    it('still renders', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { client } = mockClient();

      const { getByTestId } = render(
        <Harness client={client} i18nInstance={failing()} />,
      );

      await waitFor(() => expect(getByTestId('lang')).toHaveTextContent('en'));
    });
  });
});
