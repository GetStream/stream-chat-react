/**
 * Minimal Web Speech API stand-in for jsdom (which has none). Installs a
 * `SpeechRecognition` constructor on `window` and records every instance so
 * tests can inspect the configuration and drive `onresult` / `onerror`.
 */
export class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];

  continuous = false;
  interimResults = false;
  lang = '';
  maxAlternatives = 0;
  onend: ((event: Event) => unknown) | null = null;
  onerror: ((event: unknown) => unknown) | null = null;
  onresult: ((event: unknown) => unknown) | null = null;
  onstart: ((event: Event) => unknown) | null = null;
  start = vi.fn(() => this.onstart?.(new Event('start')));
  stop = vi.fn(() => this.onend?.(new Event('end')));
  abort = vi.fn();

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }

  emitTranscript(transcript: string) {
    this.onresult?.({
      resultIndex: 0,
      results: [Object.assign([{ confidence: 1, transcript }], { isFinal: true })],
    });
  }

  emitError(error: string) {
    this.onerror?.({ error, message: '' });
  }
}

export const installFakeSpeechRecognition = () => {
  FakeSpeechRecognition.instances = [];
  Object.defineProperty(window, 'SpeechRecognition', {
    configurable: true,
    value: FakeSpeechRecognition,
    writable: true,
  });
};

export const uninstallFakeSpeechRecognition = () => {
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition;
  FakeSpeechRecognition.instances = [];
};

export const latestRecognition = () => {
  const instance = FakeSpeechRecognition.instances.at(-1);
  if (!instance) throw new Error('no SpeechRecognition instance was created');
  return instance;
};
