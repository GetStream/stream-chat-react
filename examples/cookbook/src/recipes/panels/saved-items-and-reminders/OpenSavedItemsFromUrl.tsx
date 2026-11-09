import { findByText, useClickInTurn } from '../../../base/useClickInTurn';
import type { ClickStep } from '../../../base/useClickInTurn';

const params = new URLSearchParams(window.location.search);
const kind = params.get('kind');
const itemId = params.get('item');

// `?saved=open` clicks the Saved items button, `&kind=saved` then the Saved filter, and
// `&item=<message id>` that item, as the user would.
const steps: ClickStep[] =
  params.get('saved') === 'open'
    ? [
        {
          find: () => document.querySelector<HTMLElement>('.cookbook-saved-items-button'),
        },
        ...(kind === 'saved'
          ? [{ find: () => findByText('.cookbook-saved-items__kind', 'Saved') }]
          : []),
        ...(itemId
          ? [
              {
                find: () =>
                  document.querySelector<HTMLElement>(
                    `.cookbook-saved-item__open[data-message-id="${CSS.escape(itemId)}"]`,
                  ),
              },
            ]
          : []),
      ]
    : [];

/** For the screenshots only, not part of the recipe: opens the saved items from the URL. */
export const OpenSavedItemsFromUrl = () => {
  useClickInTurn(steps);
  return null;
};
