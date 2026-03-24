type ResizeObserverCallback = (...args: any[]) => void;

export class ResizeObserverMock {
  static observers: ResizeObserverMock[] = [];

  active = false;
  cb: ResizeObserverCallback;

  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    ResizeObserverMock.observers.push(this);
  }

  observe = vi.fn(() => {
    this.active = true;
  });
  disconnect = vi.fn(() => {
    this.active = false;
  });
}
