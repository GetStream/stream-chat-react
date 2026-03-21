export class EventEmitterMock {
  _listeners = {};

  addEventListener = jest.fn((event, handler) => {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  });

  removeEventListener = jest.fn((event, handler) => {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((h) => h !== handler);
  });

  emit(event, data) {
    const handlers = this._listeners[event];
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  }
}
