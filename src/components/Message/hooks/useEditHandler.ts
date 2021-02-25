import { MouseEvent, useState } from 'react';

export type UseEditHandlerReturnType = {
  clearEdit: (event?: React.MouseEvent<HTMLElement>) => void;
  editing: boolean;
  setEdit: (event?: React.MouseEvent<HTMLElement>) => void;
};

export const useEditHandler = (
  customInitialState = false,
  customSetEditing?: (event?: MouseEvent<HTMLElement>) => void,
  customClearEditingHandler?: (event?: React.MouseEvent<HTMLElement>) => void,
): UseEditHandlerReturnType => {
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
