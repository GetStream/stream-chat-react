import { EventEmitterMock } from './EventEmitter';

export class MediaRecorderMock extends EventEmitterMock {
  constructor() {
    super();
    this.start = jest.fn();
    this.pause = jest.fn();
    this.resume = jest.fn();
    this.stop = jest.fn();
  }

  static isTypeSupported = jest.fn().mockReturnValue(true);
}
