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
      // When enabled, simulate the browser behavior where stop triggers dataavailable.
      // Off by default to not break unit tests that manually control the data flow.
      if (MediaRecorderMock.autoEmitDataOnStop) {
        const dataEvent = {
          data: new Blob([0x48], { type: 'audio/webm' }),
          type: 'dataavailable',
        };
        queueMicrotask(() => {
          this.emit('dataavailable', dataEvent);
          this.emit('stop', { type: 'stop' });
        });
      }
    });
    this.requestData = jest.fn();
  }

  static autoEmitDataOnStop = false;
  static isTypeSupported = jest.fn().mockReturnValue(true);
}
