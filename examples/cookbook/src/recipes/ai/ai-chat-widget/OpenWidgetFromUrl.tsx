import { useClickInTurn } from '../../../base/useClickInTurn';
import type { ClickStep } from '../../../base/useClickInTurn';

// `?widget=open` clicks the launcher, as the user would.
const steps: ClickStep[] =
  new URLSearchParams(window.location.search).get('widget') === 'open'
    ? [
        {
          find: () => document.querySelector<HTMLElement>('.cookbook-assistant-launcher'),
        },
      ]
    : [];

/** For the screenshots only, not part of the recipe: opens the widget from the URL. */
export const OpenWidgetFromUrl = () => {
  useClickInTurn(steps);
  return null;
};
