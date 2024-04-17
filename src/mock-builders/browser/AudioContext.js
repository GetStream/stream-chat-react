class Connectable {
  connect = jest.fn();
  disconnect = jest.fn();
}

export class AudioContextMock {
  constructor() {}

  createAnalyser = jest.fn(() => new Connectable());
  createMediaStreamSource = jest.fn(() => new Connectable());
  close = jest.fn();
}
