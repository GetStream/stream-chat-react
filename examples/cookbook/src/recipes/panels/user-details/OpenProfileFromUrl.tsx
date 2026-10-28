import { useClickInTurn } from '../../../base/useClickInTurn';
import type { ClickStep } from '../../../base/useClickInTurn';

const name = new URLSearchParams(window.location.search).get('profile');

const steps: ClickStep[] = name
  ? [
      {
        find: () =>
          document.querySelector<HTMLElement>(
            `.str-chat__channel .str-chat__message .str-chat__avatar[title="${CSS.escape(name)}"]`,
          ),
      },
    ]
  : [];

/**
 * For the screenshots only, not part of the recipe. `?profile=<name>` clicks that person's avatar
 * on their first message in the channel, once it's on screen.
 */
export const OpenProfileFromUrl = () => {
  useClickInTurn(steps);
  return null;
};
