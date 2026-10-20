/* eslint-disable vitest/prefer-spy-on */
import { EventEmitterMock } from './EventEmitter';

export class MediaRecorderMock extends EventEmitterMock {
  state: string;
  start: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  requestData: ReturnType<typeof vi.fn>;

  constructor() {
    super();
    this.state = 'inactive';
    this.start = vi.fn(() => {
      this.state = 'recording';
    });
    this.pause = vi.fn(() => {
      this.state = 'paused';
    });
    this.resume = vi.fn(() => {
      this.state = 'recording';
    });
    this.stop = vi.fn(() => {
      this.state = 'inactive';
      // Simulates the browser emitting `dataavailable` on stop. Off by default so tests that drive
      // the data flow by hand keep working.
      if (MediaRecorderMock.autoEmitDataOnStop) {
        const dataEvent = {
          data: new Blob([new Uint8Array([0x48])], { type: 'audio/webm' }),
          type: 'dataavailable',
        };
        queueMicrotask(() => {
          this.emit('dataavailable', dataEvent);
          this.emit('stop', { type: 'stop' });
        });
      }
    });
    this.requestData = vi.fn();
  }

  static autoEmitDataOnStop = false;
  static isTypeSupported = vi.fn().mockReturnValue(true);
}
