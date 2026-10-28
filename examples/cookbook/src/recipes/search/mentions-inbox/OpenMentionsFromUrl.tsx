import { useClickInTurn } from '../../../base/useClickInTurn';
import type { ClickStep } from '../../../base/useClickInTurn';

const params = new URLSearchParams(window.location.search);
const mentionId = params.get('mention');

// `?mentions=open` clicks the Mentions button, and `&mention=<message id>` then clicks that
// mention, as the user would.
const steps: ClickStep[] =
  params.get('mentions') === 'open'
    ? [
        { find: () => document.querySelector<HTMLElement>('.cookbook-mentions-button') },
        ...(mentionId
          ? [
              {
                find: () =>
                  document.querySelector<HTMLElement>(
                    `.cookbook-mention[data-message-id="${CSS.escape(mentionId)}"]`,
                  ),
              },
            ]
          : []),
      ]
    : [];

/** For the screenshots only, not part of the recipe: opens the mentions from the URL. */
export const OpenMentionsFromUrl = () => {
  useClickInTurn(steps);
  return null;
};
