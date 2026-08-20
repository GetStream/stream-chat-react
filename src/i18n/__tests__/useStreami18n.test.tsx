import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { StreamChat } from 'stream-chat';

import { useStreami18n } from '../useStreami18n';
import { Streami18n } from '../Streami18n';
import {
  TranslationProvider,
  useTranslationContext,
} from '../../context/TranslationContext';

const client = fromPartial<StreamChat>({ user: undefined });

const Readout = ({ onRender }: { onRender?: (lang: string) => void }) => {
  const { userLanguage } = useTranslationContext();
  onRender?.(userLanguage);
  return <span data-testid='lang'>{userLanguage}</span>;
};

const Harness = ({
  i18nInstance,
  onRender,
}: {
  i18nInstance?: Streami18n;
  onRender?: (lang: string) => void;
}) => {
  const value = useStreami18n({ client, i18nInstance });
  return (
    <TranslationProvider value={value}>
      <Readout onRender={onRender} />
    </TranslationProvider>
  );
};

describe('useStreami18n', () => {
  /**
   * `window.navigator.language` must not be read during render.
   *
   * Two reasons: there is no `window` on the server, and a value that differs between the server
   * render and the first client render is a hydration mismatch. Both are covered by the same
   * observable property — the browser language may only appear *after* mount.
   *
   * Not asserted through `renderToString`, deliberately. `<Chat>` is not server-renderable today for
   * an unrelated reason: `useStateStore` calls `useSyncExternalStore` without a `getServerSnapshot`,
   * so anything reading a `StateStore` throws "Missing getServerSnapshot" on the server. A real
   * server-render test here would fail on that rather than on this hook. If that is ever fixed, add
   * one.
   */
  describe('applies the browser language after mount, not during the first render', () => {
    it('starts at the default and switches once the effect has run', async () => {
      vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('de-DE');
      const i18nInstance = new Streami18n({ logger: () => null });
      i18nInstance.registerTranslation('de', { 'common.cancel.label': 'Abbrechen' });
      const seen: string[] = [];

      render(
        <Harness i18nInstance={i18nInstance} onRender={(lang) => seen.push(lang)} />,
      );

      // First render agrees with what the server would have produced.
      expect(seen[0]).toBe('en');
      await waitFor(() => expect(seen.at(-1)).toBe('de'));
    });

    it('ignores a browser language the instance has no dictionary for', async () => {
      vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('sw-KE');
      const seen: string[] = [];

      render(<Harness onRender={(lang) => seen.push(lang)} />);

      await waitFor(() => expect(seen.length).toBeGreaterThan(0));
      expect(new Set(seen)).toEqual(new Set(['en']));
    });
  });
});
