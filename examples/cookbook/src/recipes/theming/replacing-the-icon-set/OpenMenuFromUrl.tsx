import { useEffect } from 'react';

const params = new URLSearchParams(window.location.search);
const messageId = params.get('menu');
const openAttachMenu = params.has('attach');

// What to open: a message's actions menu, or the channel composer's attachment menu.
const toggleSelector = messageId
  ? `.str-chat__channel [data-message-id='${messageId}'] [data-testid='message-actions-toggle-button']`
  : openAttachMenu
    ? ".str-chat__channel [data-testid='invoke-attachment-selector-button']"
    : undefined;
const openMenuSelector = messageId
  ? '.str-chat__message-actions-box--open'
  : "[data-testid='attachment-selector-actions-menu']";

/**
 * For the screenshots only, not part of the recipe: `?menu=<message id>` opens that message's
 * actions menu, and `?attach` the composer's attachment menu, as a user would. It clicks the
 * toggle again until the menu is open, since a click before the UI is ready does nothing.
 */
export const OpenMenuFromUrl = () => {
  useEffect(() => {
    if (!toggleSelector) return;
    const timer = setInterval(() => {
      if (document.querySelector(openMenuSelector)) {
        clearInterval(timer);
        return;
      }
      document.querySelector<HTMLElement>(toggleSelector)?.click();
    }, 600);
    return () => clearInterval(timer);
  }, []);
  return null;
};
