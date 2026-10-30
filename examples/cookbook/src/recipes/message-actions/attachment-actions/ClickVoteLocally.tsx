import { useEffect } from 'react';

/**
 * For the screenshots only, not part of the recipe: `?vote=love` clicks the first "Love" button
 * once it's on screen, so the shot shows the reaction the click adds. The cookbook is read-only,
 * so the reaction stays on this device; reloading the page drops it.
 */
export const ClickVoteLocally = () => {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('vote') !== 'love') return;

    const timer = setInterval(() => {
      const button = [
        ...document.querySelectorAll<HTMLButtonElement>('.cookbook-vote-actions__button'),
      ].find((element) => element.textContent === 'Love');
      if (!button) return;
      clearInterval(timer);
      button.click();
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return null;
};
