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

type DialogsManagerState = {
  dialogs: Dialogs;
  openDialogCount: number;
};

export class DialogsManager {
  id: string;
  state = new StateStore<DialogsManagerState>({
    dialogs: {},
    openDialogCount: 0,
  });

  constructor({ id }: DialogInitOptions = {}) {
    this.id = id ?? new Date().getTime().toString();
  }

  getOrCreate({ id }: GetOrCreateParams) {
    let dialog = this.state.getLatestValue().dialogs[id];
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
        ...{ dialogs: { ...current.dialogs, [id]: dialog } },
      }));
    }
    return dialog;
  }

  open(params: GetOrCreateParams, single?: boolean) {
    const dialog = this.getOrCreate(params);
    if (dialog.isOpen) return;
    if (single) {
      this.closeAll();
    }
    this.state.next((current) => ({
      ...current,
      dialogs: { ...current.dialogs, [dialog.id]: { ...dialog, isOpen: true } },
      openDialogCount: ++current.openDialogCount,
    }));
  }

  close(id: DialogId) {
    const dialog = this.state.getLatestValue().dialogs[id];
    if (!dialog?.isOpen) return;
    dialog.isOpen = false;
    this.state.next((current) => ({
      ...current,
      dialogs: { ...current.dialogs, [dialog.id]: { ...dialog, isOpen: false } },
      openDialogCount: --current.openDialogCount,
    }));
  }

  closeAll() {
    Object.values(this.state.getLatestValue().dialogs).forEach((dialog) => dialog.close());
  }

  toggleOpen(params: GetOrCreateParams) {
    if (this.state.getLatestValue().dialogs[params.id]?.isOpen) {
      this.close(params.id);
    } else {
      this.open(params);
    }
  }

  toggleOpenSingle(params: GetOrCreateParams) {
    if (this.state.getLatestValue().dialogs[params.id]?.isOpen) {
      this.close(params.id);
    } else {
      this.open(params, true);
    }
  }

  remove(id: DialogId) {
    const state = this.state.getLatestValue();
    const dialog = state.dialogs[id];
    if (!dialog) return;

    this.state.next((current) => ({
      ...current,
      dialogs: Object.entries(current.dialogs).reduce<Dialogs>((acc, [dialogId, dialog]) => {
        if (id !== dialogId) {
          acc[id] = dialog;
        }
        return acc;
      }, {}),
      openDialogCount:
        current.openDialogCount &&
        (dialog.isOpen ? current.openDialogCount - 1 : current.openDialogCount),
    }));
  }
}
