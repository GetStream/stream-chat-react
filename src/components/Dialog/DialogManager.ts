import { StateStore } from 'stream-chat';

export type GetOrCreateDialogParams = {
  id: DialogId;
};

type DialogId = string;

export type Dialog = {
  close: () => void;
  id: DialogId;
  isOpen: boolean | undefined;
  open: (zIndex?: number) => void;
  remove: () => void;
  toggle: (closeAll?: boolean) => void;
};

export type DialogManagerOptions = {
  id?: string;
};

type Dialogs = Record<DialogId, Dialog>;

export type DialogManagerState = {
  dialogsById: Dialogs;
};

/**
 * Keeps a map of Dialog objects.
 * Dialog can be controlled via `Dialog` object retrieved using `useDialog()` hook.
 * The hook returns an object with the following API:
 *
 * - `dialog.open()` - opens the dialog
 * - `dialog.close()` - closes the dialog
 * - `dialog.toggle()` - toggles the dialog open state. Accepts boolean argument closeAll. If enabled closes any other dialog that would be open.
 * - `dialog.remove()` - removes the dialog object reference from the state (primarily for cleanup purposes)
 */
export class DialogManager {
  id: string;
  state = new StateStore<DialogManagerState>({
    dialogsById: {},
  });

  constructor({ id }: DialogManagerOptions = {}) {
    this.id = id ?? new Date().getTime().toString();
  }

  get openDialogCount() {
    return Object.values(this.state.getLatestValue().dialogsById).reduce((count, dialog) => {
      if (dialog.isOpen) return count + 1;
      return count;
    }, 0);
  }

  getOrCreate({ id }: GetOrCreateDialogParams) {
    let dialog = this.state.getLatestValue().dialogsById[id];
    if (!dialog) {
      dialog = {
        close: () => {
          this.close(id);
        },
        id,
        isOpen: false,
        open: () => {
          this.open({ id });
        },
        remove: () => {
          this.remove(id);
        },
        toggle: (closeAll = false) => {
          this.toggle({ id }, closeAll);
        },
      };
      this.state.next((current) => ({
        ...current,
        ...{ dialogsById: { ...current.dialogsById, [id]: dialog } },
      }));
    }
    return dialog;
  }

  open(params: GetOrCreateDialogParams, closeRest?: boolean) {
    const dialog = this.getOrCreate(params);
    if (dialog.isOpen) return;
    if (closeRest) {
      this.closeAll();
    }
    this.state.next((current) => ({
      ...current,
      dialogsById: { ...current.dialogsById, [dialog.id]: { ...dialog, isOpen: true } },
    }));
  }

  close(id: DialogId) {
    const dialog = this.state.getLatestValue().dialogsById[id];
    if (!dialog?.isOpen) return;
    this.state.next((current) => ({
      ...current,
      dialogsById: { ...current.dialogsById, [dialog.id]: { ...dialog, isOpen: false } },
    }));
  }

  closeAll() {
    Object.values(this.state.getLatestValue().dialogsById).forEach((dialog) => dialog.close());
  }

  toggle(params: GetOrCreateDialogParams, closeAll = false) {
    if (this.state.getLatestValue().dialogsById[params.id]?.isOpen) {
      this.close(params.id);
    } else {
      this.open(params, closeAll);
    }
  }

  remove(id: DialogId) {
    const state = this.state.getLatestValue();
    const dialog = state.dialogsById[id];
    if (!dialog) return;

    this.state.next((current) => {
      const newDialogs = { ...current.dialogsById };
      delete newDialogs[id];
      return {
        ...current,
        dialogsById: newDialogs,
      };
    });
  }
}
