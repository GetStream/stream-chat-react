class Connectable {
  connect = jest.fn();
  disconnect = jest.fn();
}

export class AudioContextMock {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  createAnalyser = jest.fn(() => new Connectable());
  createMediaStreamSource = jest.fn(() => new Connectable());
  close = jest.fn();
}
