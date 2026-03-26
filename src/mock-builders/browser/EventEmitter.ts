type EventHandler = (data?: unknown) => void;

export class EventEmitterMock {
  _listeners: Record<string, EventHandler[]> = {};

  addEventListener = vi.fn((event: string, handler: EventHandler) => {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  });

  removeEventListener = vi.fn((event: string, handler: EventHandler) => {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((h) => h !== handler);
  });

  emit(event: string, data?: unknown) {
    const handlers = this._listeners[event];
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  }
}
