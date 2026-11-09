import { nanoid } from 'nanoid';
import { StateStore } from '@stream-io/state-store';

export type GetDialogParams = {
  id: DialogId;
};
export type GetOrCreateDialogParams = GetDialogParams & {
  /** Per-dialog override. Defaults to the manager's `closeOnClickOutside`. */
  closeOnClickOutside?: boolean;
};

type DialogId = string;

export type Dialog = {
  close: () => void;
  closeOnClickOutside?: boolean;
  id: DialogId;
  isOpen: boolean | undefined;
  open: (zIndex?: number) => void;
  removalTimeout: NodeJS.Timeout | undefined;
  remove: () => void;
  toggle: (closeAll?: boolean) => void;
};

export type DialogManagerOptions = {
  /** Closes open dialogs on a click on the overlay or outside it. Defaults to true. */
  closeOnClickOutside?: boolean;
  id?: string;
};

type Dialogs = Record<DialogId, Dialog>;

export type DialogManagerState = {
  dialogsById: Dialogs;
  openedDialogIds: DialogId[];
};

/**
 * Keeps the dialogs by ID and which of them are open, in opening order. A dialog is controlled
 * through the `Dialog` object that `useDialog()` returns.
 */
export class DialogManager {
  /** Outside-click policy of dialogs that do not set their own. */
  closeOnClickOutside: boolean;
  id: string;
  state = new StateStore<DialogManagerState>({
    dialogsById: {},
    openedDialogIds: [],
  });

  constructor({ closeOnClickOutside = true, id }: DialogManagerOptions = {}) {
    this.closeOnClickOutside = closeOnClickOutside;
    this.id = id ?? nanoid();
  }

  get openDialogCount() {
    return this.state.getLatestValue().openedDialogIds.length;
  }

  get(id: DialogId): Dialog | undefined {
    return this.state.getLatestValue().dialogsById[id];
  }

  getOrCreate({ closeOnClickOutside, id }: GetOrCreateDialogParams) {
    let dialog = this.get(id);
    if (!dialog) {
      dialog = {
        close: () => {
          this.close(id);
        },
        closeOnClickOutside,
        id,
        isOpen: false,
        open: () => {
          this.open({ id });
        },
        removalTimeout: undefined,
        remove: () => {
          this.remove(id);
        },
        toggle: (closeAll = false) => {
          this.toggle({ id }, closeAll);
        },
      };
      this.state.next((current) => ({
        ...current,
        dialogsById: { ...current.dialogsById, [id]: dialog as Dialog },
      }));
    }

    const shouldUpdateDialogSettings =
      dialog.closeOnClickOutside !== closeOnClickOutside || !!dialog.removalTimeout;

    if (shouldUpdateDialogSettings) {
      if (dialog.removalTimeout) clearTimeout(dialog.removalTimeout);
      this.state.next((current) => ({
        ...current,
        dialogsById: {
          ...current.dialogsById,
          [id]: {
            ...current.dialogsById[id],
            closeOnClickOutside,
            removalTimeout: undefined,
          },
        },
        openedDialogIds: current.dialogsById[id]?.isOpen
          ? [...current.openedDialogIds.filter((dialogId) => dialogId !== id), id]
          : current.openedDialogIds,
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
      openedDialogIds: [
        ...current.openedDialogIds.filter((dialogId) => dialogId !== dialog.id),
        dialog.id,
      ],
    }));
  }

  close(id: DialogId) {
    const dialog = this.state.getLatestValue().dialogsById[id];
    if (!dialog?.isOpen) return;
    this.state.next((current) => ({
      ...current,
      dialogsById: { ...current.dialogsById, [dialog.id]: { ...dialog, isOpen: false } },
      openedDialogIds: current.openedDialogIds.filter((dialogId) => dialogId !== id),
    }));
  }

  closeAll() {
    Object.values(this.state.getLatestValue().dialogsById).forEach((dialog) =>
      dialog.close(),
    );
  }

  toggle(params: GetOrCreateDialogParams, closeAll = false) {
    if (this.state.getLatestValue().dialogsById[params.id]?.isOpen) {
      this.close(params.id);
    } else {
      this.open(params, closeAll);
    }
  }

  remove = (id: DialogId) => {
    const dialog = this.get(id);
    if (!dialog) return;

    if (dialog.removalTimeout) {
      clearTimeout(dialog.removalTimeout);
    }

    this.state.next((current) => {
      const newDialogs = { ...current.dialogsById };
      delete newDialogs[id];
      return {
        ...current,
        dialogsById: newDialogs,
        openedDialogIds: current.openedDialogIds.filter((dialogId) => dialogId !== id),
      };
    });
  };

  /**
   * Marks the dialog as unused: it leaves the opened dialogs now and is removed after 16 ms unless
   * it is referenced again first.
   */
  markForRemoval(id: DialogId) {
    const dialog = this.get(id);

    if (!dialog) {
      return;
    }

    this.state.next((current) => ({
      ...current,
      dialogsById: {
        ...current.dialogsById,
        [id]: {
          ...dialog,
          removalTimeout: setTimeout(() => {
            this.remove(id);
          }, 16),
        },
      },
      openedDialogIds: current.openedDialogIds.filter((dialogId) => dialogId !== id),
    }));
  }

  cancelPendingRemoval(id: DialogId) {
    const dialog = this.get(id);

    if (!dialog?.removalTimeout) {
      return;
    }

    clearTimeout(dialog.removalTimeout);

    this.state.next((current) => ({
      ...current,
      dialogsById: {
        ...current.dialogsById,
        [id]: {
          ...current.dialogsById[id],
          removalTimeout: undefined,
        },
      },
      openedDialogIds: current.dialogsById[id]?.isOpen
        ? [...current.openedDialogIds.filter((dialogId) => dialogId !== id), id]
        : current.openedDialogIds,
    }));
  }
}
