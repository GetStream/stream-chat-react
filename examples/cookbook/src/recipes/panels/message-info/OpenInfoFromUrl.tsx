import { findByText, useClickInTurn } from '../../../base/useClickInTurn';
import type { ClickStep } from '../../../base/useClickInTurn';

const messageId = new URLSearchParams(window.location.search).get('info');

const isActionsMenuOpen = () =>
  !!document.querySelector('.str-chat__message-actions-box--open');

// Until Info shows, the message's actions menu is opened again: it may not be ready yet. A menu
// that is already open is left alone, since clicking its toggle again would close it.
const steps: ClickStep[] = messageId
  ? [
      {
        find: () => findByText('.str-chat__message-actions-box--open button', 'Info'),
        retry: () => {
          if (isActionsMenuOpen()) return;
          document
            .querySelector<HTMLElement>(
              `[data-message-id='${messageId}'] [data-testid='message-actions-toggle-button']`,
            )
            ?.click();
        },
      },
    ]
  : [];

/**
 * For the screenshot only, not part of the recipe: `?info=<message id>` opens that message's
 * actions menu once the message is on screen and clicks Info, as a user would.
 */
export const OpenInfoFromUrl = () => {
  useClickInTurn(steps);
  return null;
};
