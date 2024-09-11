import { StateStore } from 'stream-chat';

type DialogId = string;

export type GetOrCreateParams = {
  id: DialogId;
};

export type Dialog = {
  close: () => void;
  id: DialogId;
  isOpen: boolean | undefined;
  open: (zIndex?: number) => void;
  remove: () => void;
  toggle: () => void;
  toggleSingle: () => void;
};

type DialogInitOptions = {
  id?: string;
};

type Dialogs = Record<DialogId, Dialog>;

type DialogManagerState = {
  dialogsById: Dialogs;
  openDialogCount: number;
};

export class DialogManager {
  id: string;
  state = new StateStore<DialogManagerState>({
    dialogsById: {},
    openDialogCount: 0,
  });

  constructor({ id }: DialogInitOptions = {}) {
    this.id = id ?? new Date().getTime().toString();
  }

  getOrCreate({ id }: GetOrCreateParams) {
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
        toggle: () => {
          this.toggleOpen({ id });
        },
        toggleSingle: () => {
          this.toggleOpenSingle({ id });
        },
      };
      this.state.next((current) => ({
        ...current,
        ...{ dialogsById: { ...current.dialogsById, [id]: dialog } },
      }));
    }
    return dialog;
  }

  open(params: GetOrCreateParams, closeRest?: boolean) {
    const dialog = this.getOrCreate(params);
    if (dialog.isOpen) return;
    if (closeRest) {
      this.closeAll();
    }
    this.state.next((current) => ({
      ...current,
      dialogsById: { ...current.dialogsById, [dialog.id]: { ...dialog, isOpen: true } },
      openDialogCount: ++current.openDialogCount,
    }));
  }

  close(id: DialogId) {
    const dialog = this.state.getLatestValue().dialogsById[id];
    if (!dialog?.isOpen) return;
    this.state.next((current) => ({
      ...current,
      dialogsById: { ...current.dialogsById, [dialog.id]: { ...dialog, isOpen: false } },
      openDialogCount: --current.openDialogCount,
    }));
  }

  closeAll() {
    Object.values(this.state.getLatestValue().dialogsById).forEach((dialog) => dialog.close());
  }

  toggleOpen(params: GetOrCreateParams) {
    if (this.state.getLatestValue().dialogsById[params.id]?.isOpen) {
      this.close(params.id);
    } else {
      this.open(params);
    }
  }

  toggleOpenSingle(params: GetOrCreateParams) {
    if (this.state.getLatestValue().dialogsById[params.id]?.isOpen) {
      this.close(params.id);
    } else {
      this.open(params, true);
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
        openDialogCount:
          current.openDialogCount &&
          (dialog.isOpen ? current.openDialogCount - 1 : current.openDialogCount),
      };
    });
  }
}
