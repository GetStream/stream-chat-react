import { useEffect } from 'react';

const waitFor = <T extends Element>(selector: string) =>
  new Promise<T>((resolve) => {
    const timer = setInterval(() => {
      const element = document.querySelector<T>(selector);
      if (!element) return;
      clearInterval(timer);
      resolve(element);
    }, 100);
  });

/**
 * `?simulate=search-dialog&q=<text>` opens the search dialog and types `text` into it, for the
 * screenshots. `&layout=mixed` switches the results to the mixed list, and `&filters=open` opens the
 * filters and sort panel.
 */
export const SimulateSearchDialog = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (params.get('simulate') !== 'search-dialog' || !query) return;
    let cancelled = false;

    void (async () => {
      // Waits for the channel list to load, so the client the dialog searches with is connected.
      await waitFor('.str-chat__channel-list-item');
      const button = await waitFor<HTMLButtonElement>('.cookbook-search-trigger__button');
      if (cancelled || document.querySelector('.cookbook-search-dialog')) return;
      button.click();
      const input = await waitFor<HTMLInputElement>('.cookbook-search-dialog__input');
      if (cancelled) return;
      // Sets the value the way typing does, so React's onChange runs.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
        input,
        query,
      );
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (params.get('layout') === 'mixed') {
        document
          .querySelector<HTMLInputElement>('.cookbook-search-dialog input[value="mixed"]')
          ?.click();
      }
      if (params.get('filters') === 'open') {
        document
          .querySelector<HTMLButtonElement>('.cookbook-search-dialog__filters-button')
          ?.click();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};
