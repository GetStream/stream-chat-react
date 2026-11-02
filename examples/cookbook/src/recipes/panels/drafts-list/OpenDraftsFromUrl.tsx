import { useClickInTurn } from '../../../base/useClickInTurn';
import type { ClickStep } from '../../../base/useClickInTurn';

const params = new URLSearchParams(window.location.search);
const draftKey = params.get('draft');

// `?drafts=open` clicks the Drafts button, and `&draft=<channel cid>/<parent message id>` then
// clicks that draft, as the user would.
const steps: ClickStep[] =
  params.get('drafts') === 'open'
    ? [
        { find: () => document.querySelector<HTMLElement>('.cookbook-drafts-button') },
        ...(draftKey
          ? [
              {
                find: () =>
                  document.querySelector<HTMLElement>(
                    `.cookbook-draft__open[data-draft-key="${CSS.escape(draftKey)}"]`,
                  ),
              },
            ]
          : []),
      ]
    : [];

/** For the screenshots only, not part of the recipe: opens the drafts from the URL. */
export const OpenDraftsFromUrl = () => {
  useClickInTurn(steps);
  return null;
};
