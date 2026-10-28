import { useEffect } from 'react';

/**
 * One click of a screenshot helper: `find` returns the element to click, or nothing while it isn't
 * on screen yet. `retry`, when given, runs while `find` finds nothing, to bring the element on
 * screen, for example by opening the menu that holds it again.
 */
export type ClickStep = {
  find: () => HTMLElement | null | undefined;
  retry?: () => void;
};

/** The first element matching `selector` whose text includes `text`. */
export const findByText = (selector: string, text: string) =>
  [...document.querySelectorAll<HTMLElement>(selector)].find((element) =>
    element.textContent?.includes(text),
  );

/**
 * For screenshot helpers that open a recipe's UI from the URL, as a user would: clicks each step's
 * element in turn, waiting for each one to appear first. It checks every 200 ms and stops after
 * the last click, or when the component unmounts. An empty list clicks nothing. Pass the same
 * array on every render, for example one built at module level from the URL, or the clicks start
 * over.
 */
export const useClickInTurn = (steps: ClickStep[]) => {
  useEffect(() => {
    if (!steps.length) return;
    let next = 0;
    const timer = setInterval(() => {
      const step = steps[next];
      const target = step.find();
      if (!target) {
        step.retry?.();
        return;
      }
      target.click();
      next += 1;
      if (next === steps.length) clearInterval(timer);
    }, 200);
    return () => clearInterval(timer);
  }, [steps]);
};
