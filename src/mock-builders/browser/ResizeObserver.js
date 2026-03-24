export class ResizeObserverMock {
  static observers = [];

  active = false;
  cb;

  constructor(cb) {
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
