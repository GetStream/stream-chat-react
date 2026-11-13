import { findByText, useClickInTurn } from '../../../base/useClickInTurn';
import type { ClickStep } from '../../../base/useClickInTurn';

const params = new URLSearchParams(window.location.search);
const kind = params.get('kind');
const itemId = params.get('item');

/** Whether the panel shows a loaded list or its note, rather than the loading indicator. */
const isListLoaded = () =>
  !!document.querySelector('.cookbook-saved-items__list, .cookbook-saved-items__note');

// `?saved=open` clicks the Saved items button, `&kind=saved` then the Saved filter, and
// `&item=<message id>` that item, as the user would. The Saved filter is clicked only once the
// Reminders list has loaded: a switch while its query runs gets that query's page in the Saved
// list too, because the paginator places a page that arrives after its filters changed
// (REACT-1578).
const steps: ClickStep[] =
  params.get('saved') === 'open'
    ? [
        {
          find: () =>
            document.querySelector<HTMLElement>('button[aria-label="Saved items"]'),
        },
        ...(kind === 'saved'
          ? [
              {
                find: () =>
                  isListLoaded()
                    ? findByText('.cookbook-saved-items__kind', 'Saved')
                    : undefined,
              },
            ]
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
