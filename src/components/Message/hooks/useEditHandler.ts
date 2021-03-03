import { MouseEvent, useState } from 'react';

import type { EventHandlerReturnType } from '../types';

export type EditHandlerReturnType = {
  clearEdit: (event?: React.MouseEvent<HTMLElement>) => void;
  editing: boolean;
  setEdit: EventHandlerReturnType;
};

export const useEditHandler = (
  customInitialState = false,
  customSetEditing?: (event?: MouseEvent<HTMLElement>) => void,
  customClearEditingHandler?: (event?: React.MouseEvent<HTMLElement>) => void,
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
