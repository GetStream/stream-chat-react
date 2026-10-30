import type { ClickStep } from '../../../base/useClickInTurn';
import { useClickInTurn } from '../../../base/useClickInTurn';

const params = new URLSearchParams(window.location.search);
const accepts = params.get('simulate') === 'accept';
const channelName = params.get('row') ?? '';

const steps: ClickStep[] = accepts
  ? [
      {
        find: () =>
          document.querySelector<HTMLElement>(
            `[aria-label="Accept invitation to ${CSS.escape(channelName)}"]`,
          ),
      },
    ]
  : [];

/**
 * For the screenshots: `?simulate=accept&row=<channel name>` presses that invitation's Accept
 * button, as a click would. The cookbook is read-only, so the request never settles and the button
 * keeps reading "Joining…".
 */
export const SimulateInvites = () => {
  useClickInTurn(steps);
  return null;
};
