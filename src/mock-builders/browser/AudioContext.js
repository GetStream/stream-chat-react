class Connectable {
  connect = vi.fn();
  disconnect = vi.fn();
}

export class AudioContextMock {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  createAnalyser = vi.fn(() => new Connectable());
  createMediaStreamSource = vi.fn(() => new Connectable());
  close = vi.fn();
}
