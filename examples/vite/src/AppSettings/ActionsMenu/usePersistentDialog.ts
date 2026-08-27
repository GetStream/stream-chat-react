import { useDialog, useNearestDialogManagerContext } from 'stream-chat-react';

/**
 * Registers a dialog that must not close when the user clicks elsewhere in the app.
 *
 * **Every call site touching the same dialog id has to use this hook.**
 * `DialogManager.getOrCreate` applies `closeOnClickOutside` only when it *creates* the dialog,
 * and these dialogs are resolved twice — once by whatever opens them (the Actions menu, a
 * message action) and once by the dialog component itself. Whichever runs first wins, so if one
 * of them registered without the override the other's would be silently ignored.
 *
 * `useDialogOnNearestManager` cannot be used for this: it accepts only `id`.
 */
export const usePersistentDialog = (id: string) => {
  const { dialogManager } = useNearestDialogManagerContext() ?? {};
  const dialog = useDialog({
    closeOnClickOutside: false,
    dialogManagerId: dialogManager?.id,
    id,
  });

  return { dialog, dialogManager };
};
