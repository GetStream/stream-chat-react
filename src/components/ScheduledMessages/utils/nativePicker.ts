import type { MouseEvent } from 'react';

/**
 * Opens the browser's own picker of a date or time input when the field is clicked.
 *
 * Browsers that do not support `showPicker`, or refuse it outside a user gesture, keep
 * their default behaviour.
 */
export const openNativePicker = ({ currentTarget }: MouseEvent<HTMLInputElement>) => {
  try {
    currentTarget.showPicker?.();
  } catch {
    return;
  }
};
