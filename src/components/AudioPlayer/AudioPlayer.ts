import { StateStore } from 'stream-chat';
import throttle from 'lodash.throttle';
import type { AudioPlayerPlugin } from './plugins/AudioPlayerPlugin';

export type AudioPlayerErrorCode =
  | 'failed-to-start'
  | 'not-playable'
  | 'seek-not-supported'
  | (string & {});

export type RegisterAudioPlayerErrorParams = {
  error?: Error;
  errCode?: AudioPlayerErrorCode;
};

export type AudioDescriptor = {
  id: string;
  src: string;
  /** Audio duration in seconds. */
  durationSeconds?: number;
  mimeType?: string;
};

export type AudioPlayerPlayAudioParams = {
  currentPlaybackRate?: number;
  playbackRates?: number[];
};

export type AudioPlayerState = {
  canPlayRecord: boolean;
  /** Current playback speed. Initiated with the first item of the playbackRates array. */
  currentPlaybackRate: number;
  elementRef: HTMLAudioElement;
  isPlaying: boolean;
  playbackError: Error | null;
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates: number[];
  progressPercent: number;
  secondsElapsed: number;
};

export type AudioPlayerOptions = AudioDescriptor & {
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates?: number[];
  plugins?: AudioPlayerPlugin[];
};

const DEFAULT_PLAYBACK_RATES = [1.0, 1.5, 2.0];

const isSeekable = (audioElement: HTMLAudioElement) =>
  !(audioElement.duration === Infinity || isNaN(audioElement.duration));

export const defaultRegisterAudioPlayerError = ({
  error,
}: RegisterAudioPlayerErrorParams = {}) => {
  if (!error) return;
  console.error('[AUDIO PLAYER]', error);
};

export const elementIsPlaying = (audioElement: HTMLAudioElement | null) =>
  audioElement && !(audioElement.paused || audioElement.ended);

export type SeekFn = (params: { clientX: number; currentTarget: HTMLDivElement }) => void;

export class AudioPlayer {
  state: StateStore<AudioPlayerState>;
  private _id: string;
  /** The audio MIME type that is checked before the audio is played. If the type is not supported the controller registers error in playbackError. */
  private _mimeType?: string;
  private _durationSeconds?: number;
  private _plugins = new Map<string, AudioPlayerPlugin>();
  private playTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

  constructor({
    durationSeconds,
    id,
    mimeType,
    playbackRates: customPlaybackRates,
    plugins,
    src,
  }: AudioPlayerOptions) {
    this._id = id;
    this._mimeType = mimeType;
    this._durationSeconds = durationSeconds;
    this.setPlugins(() => plugins ?? []);

    const playbackRates = customPlaybackRates?.length
      ? customPlaybackRates
      : DEFAULT_PLAYBACK_RATES;

    const elementRef = new Audio(src);
    const canPlayRecord = mimeType ? !!elementRef.canPlayType(mimeType) : true;

    this.state = new StateStore<AudioPlayerState>({
      canPlayRecord,
      currentPlaybackRate: playbackRates[0],
      elementRef,
      isPlaying: false,
      playbackError: null,
      playbackRates,
      progressPercent: 0,
      secondsElapsed: 0,
    });

    this.plugins.forEach((p) => p.onInit?.({ player: this }));
  }

  private get plugins(): AudioPlayerPlugin[] {
    return Array.from(this._plugins.values());
  }

  get canPlayRecord() {
    return this.state.getLatestValue().canPlayRecord;
  }

  get elementRef() {
    return this.state.getLatestValue().elementRef;
  }

  get isPlaying(): boolean {
    return this.state.getLatestValue().isPlaying;
  }

  get currentPlaybackRate() {
    return this.state.getLatestValue().currentPlaybackRate;
  }

  get playbackRates() {
    return this.state.getLatestValue().playbackRates;
  }

  get id() {
    return this._id;
  }

  get src() {
    return this.elementRef.src;
  }

  get secondsElapsed() {
    return this.state.getLatestValue().secondsElapsed;
  }

  get progressPercent() {
    return this.state.getLatestValue().progressPercent;
  }

  get durationSeconds() {
    return this._durationSeconds;
  }

  get mimeType() {
    return this._mimeType;
  }

  private setDescriptor({ durationSeconds, mimeType, src }: AudioDescriptor) {
    if (mimeType !== this._mimeType) {
      this._mimeType = mimeType;
    }

    if (durationSeconds !== this._durationSeconds) {
      this._durationSeconds = durationSeconds;
    }
    if (this.elementRef.src !== src) {
      this.elementRef.src = src;
      this.elementRef.load();
    }
  }

  private setRef = (elementRef: HTMLAudioElement) => {
    if (elementIsPlaying(this.elementRef)) {
      this.pause();
    }
    this.state.partialNext({ elementRef });
  };

  setSecondsElapsed = (secondsElapsed: number) => {
    this.state.partialNext({
      progressPercent:
        this.elementRef && secondsElapsed
          ? (secondsElapsed / this.elementRef.duration) * 100
          : 0,
      secondsElapsed,
    });
  };

  setPlugins(setter: (currentPlugins: AudioPlayerPlugin[]) => AudioPlayerPlugin[]) {
    this._plugins = setter(this.plugins).reduce((acc, plugin) => {
      if (plugin.id) {
        acc.set(plugin.id, plugin);
      }
      return acc;
    }, new Map<string, AudioPlayerPlugin>());
  }

  private setupSafetyTimeout = () => {
    clearTimeout(this.playTimeout);
    this.playTimeout = setTimeout(() => {
      if (!this.elementRef) return;
      try {
        this.elementRef.pause();
        this.state.partialNext({ isPlaying: false });
      } catch (e) {
        this.registerError({ errCode: 'failed-to-start' });
      }
    }, 2000);
  };

  private clearSafetyTimeout = () => {
    if (!this.elementRef) return;
    clearTimeout(this.playTimeout);
    this.playTimeout = undefined;
  };

  canPlayMimeType = (mimeType: string) =>
    !!(mimeType && this.elementRef?.canPlayType(mimeType));

  play = async (params?: AudioPlayerPlayAudioParams) => {
    if (elementIsPlaying(this.elementRef)) {
      if (this.isPlaying) return;
      this.state.partialNext({ isPlaying: true });
      return;
    }

    const { currentPlaybackRate, playbackRates } = {
      currentPlaybackRate: this.currentPlaybackRate,
      playbackRates: this.playbackRates,
      ...params,
    };

    if (!this.canPlayRecord) {
      this.registerError({ errCode: 'not-playable' });
      return;
    }

    this.elementRef.playbackRate = currentPlaybackRate ?? this.currentPlaybackRate;

    this.setupSafetyTimeout();

    try {
      await this.elementRef.play();
      this.state.partialNext({
        currentPlaybackRate,
        isPlaying: true,
        playbackRates,
      });
    } catch (e) {
      this.registerError({ error: e as Error });
      this.state.partialNext({ isPlaying: false });
    } finally {
      this.clearSafetyTimeout();
    }
  };

  pause = () => {
    if (!elementIsPlaying(this.elementRef)) return;
    this.clearSafetyTimeout();

    // existence of the element already checked by elementIsPlaying
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.elementRef!.pause();
    this.state.partialNext({ isPlaying: false });
  };

  stop = () => {
    this.pause();
    this.setSecondsElapsed(0);
    this.elementRef.currentTime = 0;
  };

  togglePlay = async () => (this.isPlaying ? this.pause() : await this.play());

  increasePlaybackRate = () => {
    if (!this.elementRef) return;
    let currentPlaybackRateIndex = this.state
      .getLatestValue()
      .playbackRates.findIndex((rate) => rate === this.currentPlaybackRate);
    if (currentPlaybackRateIndex === -1) {
      currentPlaybackRateIndex = 0;
    }
    const nextIndex =
      currentPlaybackRateIndex === this.playbackRates.length - 1
        ? 0
        : currentPlaybackRateIndex + 1;
    const currentPlaybackRate = this.playbackRates[nextIndex];
    this.state.partialNext({ currentPlaybackRate });
    this.elementRef.playbackRate = currentPlaybackRate;
  };

  seek = throttle<SeekFn>(({ clientX, currentTarget }) => {
    if (!(currentTarget && this.elementRef)) return;
    if (!isSeekable(this.elementRef)) {
      this.registerError({ errCode: 'seek-not-supported' });
      return;
    }

    const { width, x } = currentTarget.getBoundingClientRect();

    const ratio = (clientX - x) / width;
    if (ratio > 1 || ratio < 0) return;
    const currentTime = ratio * this.elementRef.duration;
    this.setSecondsElapsed(currentTime);
    this.elementRef.currentTime = currentTime;
  }, 16);

  registerError = (params: RegisterAudioPlayerErrorParams) => {
    defaultRegisterAudioPlayerError(params);
    this.plugins.forEach(({ onError }) => onError?.({ player: this, ...params }));
  };

  onRemove = () => {
    this.plugins.forEach(({ onRemove }) => onRemove?.({ player: this }));
  };
}
