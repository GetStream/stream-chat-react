import { useClickInTurn } from '../../../base/useClickInTurn';
import type { ClickStep } from '../../../base/useClickInTurn';

const clicks = Number(new URLSearchParams(window.location.search).get('pinClicks') ?? 0);

const steps: ClickStep[] = Array.from({ length: clicks }, () => ({
  find: () => document.querySelector<HTMLElement>('.cookbook-pinned-bar'),
}));

/**
 * For the screenshot only, not part of the recipe: `?pinClicks=<n>` clicks the pinned-messages bar
 * that many times once it is on screen, as a user would.
 */
export const ClickPinnedBarFromUrl = () => {
  useClickInTurn(steps);
  return null;
};
