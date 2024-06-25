export class ResizeObserverMock {
  static observers = [];

  active = false;
  cb;

  constructor(cb) {
    this.cb = cb;
    ResizeObserverMock.observers.push(this);
  }

  observe = jest.fn(() => {
    this.active = true;
  });
  disconnect = jest.fn(() => {
    this.active = false;
  });
}
