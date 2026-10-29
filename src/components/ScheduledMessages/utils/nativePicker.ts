import type { MouseEvent } from 'react';

export const openNativePicker = ({ currentTarget }: MouseEvent<HTMLInputElement>) => {
  try {
    currentTarget.showPicker?.();
  } catch {
    return;
  }
};
