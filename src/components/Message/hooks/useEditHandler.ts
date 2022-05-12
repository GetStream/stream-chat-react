import { BaseSyntheticEvent, useCallback, useState } from 'react';

import type { ReactEventHandler } from '../types';

export type EditHandlerReturnType = {
  clearEdit: (event?: BaseSyntheticEvent) => void;
  editing: boolean;
  setEdit: ReactEventHandler;
};

export const useEditHandler = (
  customInitialState = false,
  customSetEditing?: (event?: BaseSyntheticEvent) => void,
  customClearEditingHandler?: (event?: BaseSyntheticEvent) => void,
): EditHandlerReturnType => {
  const [editing, setEditing] = useState(customInitialState);

  const defaultSetEdit = useCallback((event?: BaseSyntheticEvent) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    setEditing(true);
  }, []);

  const defaultClearEdit = useCallback((event?: BaseSyntheticEvent) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    setEditing(false);
  }, []);

  const setEdit = customSetEditing || defaultSetEdit;

  const clearEdit = customClearEditingHandler || defaultClearEdit;

  return { clearEdit, editing, setEdit };
};
