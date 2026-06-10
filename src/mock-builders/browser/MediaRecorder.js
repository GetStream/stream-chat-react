import { EventEmitterMock } from './EventEmitter';

export class MediaRecorderMock extends EventEmitterMock {
  constructor() {
    super();
    this.state = 'inactive';
    this.start = jest.fn(() => {
      this.state = 'recording';
    });
    this.pause = jest.fn(() => {
      this.state = 'paused';
    });
    this.resume = jest.fn(() => {
      this.state = 'recording';
    });
    this.stop = jest.fn(() => {
      this.state = 'inactive';
    });
  }

  static isTypeSupported = jest.fn().mockReturnValue(true);
}
