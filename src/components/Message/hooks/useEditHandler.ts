import { useState } from 'react';

import type { ReactEventHandler } from '../types';

export type EditHandlerReturnType = {
  clearEdit: (event?: React.BaseSyntheticEvent) => void;
  editing: boolean;
  setEdit: ReactEventHandler;
};

export const useEditHandler = (
  customInitialState = false,
  customSetEditing?: (event?: React.BaseSyntheticEvent) => void,
  customClearEditingHandler?: (event?: React.BaseSyntheticEvent) => void,
): EditHandlerReturnType => {
  const [editing, setEditing] = useState(customInitialState);

  const setEdit =
    customSetEditing ||
    ((event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
      setEditing(true);
    });

  const clearEdit =
    customClearEditingHandler ||
    ((event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
      setEditing(false);
    });

  return { clearEdit, editing, setEdit };
};
