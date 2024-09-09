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

type DialogEvent = { type: 'close' | 'open' };

const dialogsManagerEvents = ['openCountChange'] as const;
type DialogsManagerEvent = { type: typeof dialogsManagerEvents[number] };

type DialogEventHandler = (dialog: Dialog) => void;
type DialogsManagerEventHandler = (dialogsManager: DialogsManager) => void;

type DialogInitOptions = {
  id?: string;
};

const noop = (): void => undefined;

export class DialogsManager {
  id: string;
  openDialogCount = 0;
  dialogs: Record<DialogId, Dialog> = {};
  private dialogEventListeners: Record<
    DialogId,
    Partial<Record<DialogEvent['type'], DialogEventHandler[]>>
  > = {};
  private dialogsManagerEventListeners: Record<
    DialogsManagerEvent['type'],
    DialogsManagerEventHandler[]
  > = { openCountChange: [] };

  constructor({ id }: DialogInitOptions = {}) {
    this.id = id ?? new Date().getTime().toString();
  }

  getOrCreate({ id }: GetOrCreateParams) {
    let dialog = this.dialogs[id];
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
      this.dialogs[id] = dialog;
    }
    return dialog;
  }

  on(
    eventType: DialogEvent['type'] | DialogsManagerEvent['type'],
    { id, listener }: { listener: DialogEventHandler | DialogsManagerEventHandler; id?: DialogId },
  ) {
    if (dialogsManagerEvents.includes(eventType as DialogsManagerEvent['type'])) {
      this.dialogsManagerEventListeners[eventType as DialogsManagerEvent['type']].push(
        listener as DialogsManagerEventHandler,
      );
      return () => {
        this.off(eventType, { listener });
      };
    }
    if (!id) return noop;

    if (!this.dialogEventListeners[id]) {
      this.dialogEventListeners[id] = {};
    }

    this.dialogEventListeners[id][eventType as DialogEvent['type']] = [
      ...(this.dialogEventListeners[id][eventType as DialogEvent['type']] ?? []),
      listener as DialogEventHandler,
    ];
    return () => {
      this.off(eventType, { id, listener });
    };
  }

  off(
    eventType: DialogEvent['type'] | DialogsManagerEvent['type'],
    { id, listener }: { listener: DialogEventHandler | DialogsManagerEventHandler; id?: DialogId },
  ) {
    if (dialogsManagerEvents.includes(eventType as DialogsManagerEvent['type'])) {
      if (!this.dialogsManagerEventListeners[eventType as DialogsManagerEvent['type']]?.length)
        return;

      this.dialogsManagerEventListeners[
        eventType as DialogsManagerEvent['type']
      ] = this.dialogsManagerEventListeners[eventType as DialogsManagerEvent['type']]?.filter(
        (l) => l !== listener,
      );
      return;
    }

    if (!id) return;

    const eventListeners = this.dialogEventListeners[id]?.[eventType as DialogEvent['type']];
    if (!eventListeners) return;

    this.dialogEventListeners[id][eventType as DialogEvent['type']] = eventListeners.filter(
      (l) => l !== listener,
    );

    if (!this.dialogEventListeners[id][eventType as DialogEvent['type']]?.length) {
      delete this.dialogEventListeners[id][eventType as DialogEvent['type']];
    }

    if (!Object.keys(this.dialogEventListeners[id]).length) {
      delete this.dialogEventListeners[id];
    }
  }

  open(params: GetOrCreateParams, single?: boolean) {
    const dialog = this.getOrCreate(params);
    if (dialog.isOpen) return;
    if (single) {
      this.closeAll();
    }
    this.dialogs[params.id].isOpen = true;
    this.openDialogCount++;
    this.dialogsManagerEventListeners.openCountChange.forEach((listener) => listener(this));
    this.dialogEventListeners[params.id]?.open?.forEach((listener) => listener(dialog));
  }

  close(id: DialogId) {
    const dialog = this.dialogs[id];
    if (!dialog?.isOpen) return;
    dialog.isOpen = false;
    this.openDialogCount--;
    this.dialogEventListeners[id]?.close?.forEach((listener) => listener(dialog));
    this.dialogsManagerEventListeners.openCountChange.forEach((listener) => listener(this));
  }

  closeAll() {
    Object.values(this.dialogs).forEach((dialog) => dialog.close());
  }

  toggleOpen(params: GetOrCreateParams) {
    if (this.dialogs[params.id]?.isOpen) {
      this.close(params.id);
    } else {
      this.open(params);
    }
  }

  toggleOpenSingle(params: GetOrCreateParams) {
    if (this.dialogs[params.id]?.isOpen) {
      this.close(params.id);
    } else {
      this.open(params, true);
    }
  }

  remove(id: DialogId) {
    const dialog = this.dialogs[id];
    if (!dialog) return;

    const countListeners =
      !!this.dialogEventListeners[id] &&
      Object.values(this.dialogEventListeners[id]).reduce((acc, listeners) => {
        acc += listeners.length;
        return acc;
      }, 0);

    if (!countListeners) {
      delete this.dialogEventListeners[id];
      if (dialog.isOpen) {
        this.openDialogCount--;
      }
      delete this.dialogs[id];
    }
  }
}
