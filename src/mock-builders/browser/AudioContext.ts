class Connectable {
  connect = vi.fn();
  disconnect = vi.fn();
}

export class AudioContextMock {
  createAnalyser = vi.fn(() => new Connectable());
  createMediaStreamSource = vi.fn(() => new Connectable());
  close = vi.fn();
}
