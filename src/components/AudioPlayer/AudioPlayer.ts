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
  elementRef: HTMLAudioElement | null;
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
  private unsubscribeEventListeners: (() => void) | null = null;

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
    return this.elementRef?.src;
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

  private ensureElementRef(): HTMLAudioElement {
    if (!this.elementRef) {
      this.setRef(new Audio(this.src));
    }
    return this.elementRef as HTMLAudioElement;
  }
  private setPlaybackStartSafetyTimeout = () => {
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

  private clearPlaybackStartSafetyTimeout = () => {
    if (!this.elementRef) return;
    clearTimeout(this.playTimeout);
    this.playTimeout = undefined;
  };

  private setDescriptor({ durationSeconds, mimeType, src }: AudioDescriptor) {
    if (mimeType !== this._mimeType) {
      this._mimeType = mimeType;
    }

    if (durationSeconds !== this._durationSeconds) {
      this._durationSeconds = durationSeconds;
    }
    const elementRef = this.ensureElementRef();
    if (elementRef.src !== src) {
      elementRef.src = src;
      elementRef.load();
    }
  }

  private prepareElementRefForGarbageCollection() {
    this.stop();
    if (this.elementRef) {
      this.elementRef.src = '';
      this.elementRef.load();
      this.setRef(null);
    }
  }

  private setRef = (elementRef: HTMLAudioElement | null) => {
    if (elementIsPlaying(this.elementRef)) {
      this.prepareElementRefForGarbageCollection();
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

  canPlayMimeType = (mimeType: string) =>
    !!(mimeType && this.elementRef?.canPlayType(mimeType));

  play = async (params?: AudioPlayerPlayAudioParams) => {
    const elementRef = this.ensureElementRef();
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

    elementRef.playbackRate = currentPlaybackRate ?? this.currentPlaybackRate;

    this.setPlaybackStartSafetyTimeout();

    try {
      await elementRef.play();
      this.state.partialNext({
        currentPlaybackRate,
        isPlaying: true,
        playbackRates,
      });
    } catch (e) {
      this.registerError({ error: e as Error });
      this.state.partialNext({ isPlaying: false });
    } finally {
      this.clearPlaybackStartSafetyTimeout();
    }
  };

  pause = () => {
    if (!elementIsPlaying(this.elementRef)) return;
    this.clearPlaybackStartSafetyTimeout();

    // existence of the element already checked by elementIsPlaying
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.elementRef!.pause();
    this.state.partialNext({ isPlaying: false });
  };

  stop = () => {
    this.pause();
    this.setSecondsElapsed(0);
    if (this.elementRef) this.elementRef.currentTime = 0;
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

  /**
   * Removes the audio element reference, event listeners and audio player from the player pool.
   * Helpful when only a single AudioPlayer instance is to be removed from the AudioPlayerPool.
   */
  requestRemoval = () => {
    this.prepareElementRefForGarbageCollection();
    this.unsubscribeEventListeners?.();
    this.unsubscribeEventListeners = null;
    this.plugins.forEach(({ onRemove }) => onRemove?.({ player: this }));
  };

  registerSubscriptions = () => {
    this.unsubscribeEventListeners?.();

    const audioElement = this.ensureElementRef();

    const handleEnded = () => {
      this.state.partialNext({
        isPlaying: false,
        secondsElapsed: audioElement?.duration ?? this.durationSeconds ?? 0,
      });
    };

    const handleError = (e: HTMLMediaElementEventMap['error']) => {
      // if fired probably is one of these (e.srcElement.error.code)
      // 1 = MEDIA_ERR_ABORTED         (fetch aborted by user/JS)
      // 2 = MEDIA_ERR_NETWORK         (network failed while fetching)
      // 3 = MEDIA_ERR_DECODE          (data fetched but couldn’t decode)
      // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED (no resource supported / bad type)
      // reported during the mount so only logging to the console
      const audio = e.currentTarget as HTMLAudioElement | null;
      const state: Partial<AudioPlayerState> = { isPlaying: false };

      if (!audio?.error?.code) {
        this.state.partialNext(state);
        return;
      }

      if (audio.error.code === 4) {
        state.canPlayRecord = false;
        this.state.partialNext(state);
      }

      const errorMsg = [
        undefined,
        'MEDIA_ERR_ABORTED: fetch aborted by user',
        'MEDIA_ERR_NETWORK: network failed while fetching',
        'MEDIA_ERR_DECODE: audio fetched but couldn’t decode',
        'MEDIA_ERR_SRC_NOT_SUPPORTED: source not supported',
      ][audio?.error?.code];
      if (!errorMsg) return;

      defaultRegisterAudioPlayerError({ error: new Error(errorMsg + ` (${audio.src})`) });
    };

    const handleTimeupdate = () => {
      this.setSecondsElapsed(audioElement?.currentTime);
    };

    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('timeupdate', handleTimeupdate);

    this.unsubscribeEventListeners = () => {
      audioElement.pause();
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('timeupdate', handleTimeupdate);
    };
  };
}
