import { EventEmitterMock } from './EventEmitter';

export class MediaRecorderMock extends EventEmitterMock {
  constructor() {
    super();
  }

  start = jest.fn();
  pause = jest.fn();
  resume = jest.fn();
  stop = jest.fn();
}
