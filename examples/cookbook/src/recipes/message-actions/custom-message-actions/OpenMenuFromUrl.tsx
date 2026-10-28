import { useEffect } from 'react';

/**
 * For the screenshot only, not part of the recipe: `?menu=<message id>` opens that message's
 * actions menu once the message is on screen, by clicking its "more" button as a user would.
 */
export const OpenMenuFromUrl = () => {
  useEffect(() => {
    const messageId = new URLSearchParams(window.location.search).get('menu');
    if (!messageId) return;

    const timer = setInterval(() => {
      const toggle = document.querySelector<HTMLButtonElement>(
        `[data-message-id='${messageId}'] [data-testid='message-actions-toggle-button']`,
      );
      if (!toggle) return;
      clearInterval(timer);
      toggle.click();
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return null;
};
