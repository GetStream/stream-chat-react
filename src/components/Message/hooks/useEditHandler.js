// @ts-check

/**
 * @type {(message: import('stream-chat').MessageResponse | undefined, setEditingState: import('types').MessageComponentProps['setEditingState']) =>  (event: React.MouseEvent<HTMLElement>) => void}
 */
export const useEditHandler = (message, setEditingState) => {
  return (event) => {
    event.preventDefault();

    if (!message || !setEditingState) {
      return;
    }

    setEditingState(message);
  };
};
