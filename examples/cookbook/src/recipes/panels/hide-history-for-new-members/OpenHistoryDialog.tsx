import { useEffect } from 'react';

/**
 * For the screenshots only, not part of the recipe: `?dialog=history` clicks Add members once the
 * header is on screen, so the shot shows the dialog. It never clicks Add, so no member is added.
 */
export const OpenHistoryDialog = () => {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('dialog') !== 'history') return;

    const timer = setInterval(() => {
      const button = document.querySelector<HTMLButtonElement>('.cookbook-add-members');
      if (!button) return;
      clearInterval(timer);
      button.click();
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return null;
};
