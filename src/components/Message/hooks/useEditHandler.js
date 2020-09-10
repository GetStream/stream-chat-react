// @ts-check
import { useState } from 'react';

/**
 * @type {(
 *   customInitialState?: boolean,
 *   customSetEditing?: (event?: React.MouseEvent<HTMLElement>) => void,
 *   customClearEditingHandler?: (event?: React.MouseEvent<HTMLElement>) => void
 * ) => {
 *   editing: boolean,
 *   setEdit: (event?: React.MouseEvent<HTMLElement>) => void,
 *   clearEdit: (event?: React.MouseEvent<HTMLElement>) => void
 * }}
 */
export const useEditHandler = (
  customInitialState = false,
  customSetEditing,
  customClearEditingHandler,
) => {
  const [editing, setEditing] = useState(customInitialState);

  const setEdit =
    customSetEditing ||
    ((event) => {
      if (event) {
        event.preventDefault();
      }
      setEditing(true);
    });
  const clearEdit =
    customClearEditingHandler ||
    ((event) => {
      if (event) {
        event.preventDefault();
      }
      setEditing(false);
    });
  return { editing, setEdit, clearEdit };
};
