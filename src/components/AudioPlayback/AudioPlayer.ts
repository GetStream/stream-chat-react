import { StateStore } from 'stream-chat';
import throttle from 'lodash.throttle';
import type { AudioPlayerPlugin } from './plugins';
import type { AudioPlayerPool } from './AudioPlayerPool';

export type AudioPlayerErrorCode =
  | 'failed-to-start'
  | 'not-playable'
  | 'seek-not-supported'
  | (string & {});

export type RegisterAudioPlayerErrorParams = {
  error?: Error;
  errCode?: AudioPlayerErrorCode;
};

export type AudioPlayerDescriptor = {
  id: string;
  src: string;
  /** Audio duration in seconds. */
  durationSeconds?: number;
  fileSize?: number | string;
  mimeType?: string;
  title?: string;
  waveformData?: number[];
};

export type AudioPlayerPlayAudioParams = {
  currentPlaybackRate?: number;
  playbackRates?: number[];
};

export type AudioPlayerState = {
  /** Signals whether the browser can play the record. */
  canPlayRecord: boolean;
  /** Current playback speed. Initiated with the first item of the playbackRates array. */
  currentPlaybackRate: number;
  /** The audio element ref */
  elementRef: HTMLAudioElement | null;
  /** Signals whether the playback is in progress. */
  isPlaying: boolean;
  /** Keeps the latest playback error reference. */
  playbackError: Error | null;
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates: number[];
  /** Playback progress expressed in percent. */
  progressPercent: number;
  /** Playback progress expressed in seconds. */
  secondsElapsed: number;
};

export type AudioPlayerOptions = AudioPlayerDescriptor & {
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates?: number[];
  plugins?: AudioPlayerPlugin[];
  pool: AudioPlayerPool;
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

export type SeekFn = (params: {
  clientX: number;
  currentTarget: HTMLDivElement;
}) => Promise<void>;

export class AudioPlayer {
  state: StateStore<AudioPlayerState>;
  /** The audio MIME type that is checked before the audio is played. If the type is not supported the controller registers error in playbackError. */
  private _data: AudioPlayerDescriptor;
  private _plugins = new Map<string, AudioPlayerPlugin>();
  private playTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  private unsubscribeEventListeners: (() => void) | null = null;
  private _pool: AudioPlayerPool;
  private _disposed = false;
  private _pendingLoadedMeta?: { element: HTMLAudioElement; onLoaded: () => void };
  private _elementIsReadyPromise?: Promise<boolean>;
  private _restoringPosition = false;
  private _removalTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

  constructor({
    durationSeconds,
    fileSize,
    id,
    mimeType,
    playbackRates: customPlaybackRates,
    plugins,
    pool,
    src,
    title,
    waveformData,
  }: AudioPlayerOptions) {
    this._data = {
      durationSeconds,
      fileSize,
      id,
      mimeType,
      src,
      title,
      waveformData,
    };
    this._pool = pool;
    this.setPlugins(() => plugins ?? []);

    const playbackRates = customPlaybackRates?.length
      ? customPlaybackRates
      : DEFAULT_PLAYBACK_RATES;

    // do not create element here; only evaluate canPlayRecord cheaply
    const canPlayRecord = mimeType ? !!new Audio().canPlayType(mimeType) : true;

    this.state = new StateStore<AudioPlayerState>({
      canPlayRecord,
      currentPlaybackRate: playbackRates[0],
      elementRef: null,
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

  get durationSeconds() {
    return this._data.durationSeconds;
  }

  get fileSize() {
    return this._data.fileSize;
  }

  get id() {
    return this._data.id;
  }

  get src() {
    return this._data.src;
  }

  get mimeType() {
    return this._data.mimeType;
  }

  get title() {
    return this._data.title;
  }

  get waveformData() {
    return this._data.waveformData;
  }

  get secondsElapsed() {
    return this.state.getLatestValue().secondsElapsed;
  }

  get progressPercent() {
    return this.state.getLatestValue().progressPercent;
  }

  get disposed() {
    return this._disposed;
  }

  private ensureElementRef(): HTMLAudioElement {
    if (this._disposed) {
      throw new Error('AudioPlayer is disposed');
    }
    if (!this.elementRef) {
      const el = this._pool.acquireElement({
        ownerId: this.id,
        src: this.src,
      });
      this.setRef(el);
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

  private updateDurationFromElement = (element: HTMLAudioElement) => {
    const duration = element.duration;
    if (
      typeof duration !== 'number' ||
      isNaN(duration) ||
      !isFinite(duration) ||
      duration <= 0
    ) {
      return;
    }
    this._data.durationSeconds = duration;
  };

  private clearPlaybackStartSafetyTimeout = () => {
    if (!this.elementRef) return;
    clearTimeout(this.playTimeout);
    this.playTimeout = undefined;
  };

  private clearPendingLoadedMeta = () => {
    const pending = this._pendingLoadedMeta;
    if (pending?.element && pending.onLoaded) {
      pending.element.removeEventListener('loadedmetadata', pending.onLoaded);
    }
    this._pendingLoadedMeta = undefined;
  };

  private restoreSavedPosition = (elementRef: HTMLAudioElement) => {
    const saved = this.secondsElapsed;
    if (!saved || saved <= 0) return;
    const apply = () => {
      const duration = elementRef.duration;
      const clamped =
        typeof duration === 'number' && !isNaN(duration) && isFinite(duration)
          ? Math.min(saved, duration)
          : saved;
      try {
        if (elementRef.currentTime === clamped) return;
        elementRef.currentTime = clamped;
        // Preempt UI with restored position to avoid flicker
        this.setSecondsElapsed(clamped);
      } catch {
        // ignore
      }
    };
    // No information is available about the media resource.
    if (elementRef.readyState < 1) {
      this.clearPendingLoadedMeta();
      this._restoringPosition = true;
      const onLoaded = () => {
        // Ensure this callback still belongs to the same pending registration and same element
        if (this._pendingLoadedMeta?.onLoaded !== onLoaded) return;
        this._pendingLoadedMeta = undefined;
        if (this.elementRef !== elementRef) {
          this._restoringPosition = false;
          return;
        }
        apply();
        this._restoringPosition = false;
      };
      elementRef.addEventListener('loadedmetadata', onLoaded, { once: true });
      this._pendingLoadedMeta = { element: elementRef, onLoaded };
    } else {
      this._restoringPosition = true;
      apply();
      this._restoringPosition = false;
    }
  };

  setDescriptor(descriptor: AudioPlayerDescriptor) {
    this._data = { ...this._data, ...descriptor };
    if (descriptor.src !== this.src && this.elementRef) {
      this.elementRef.src = descriptor.src;
    }
  }

  private releaseElement({ resetState }: { resetState: boolean }) {
    this.clearPendingLoadedMeta();
    this._restoringPosition = false;
    if (resetState) {
      this.stop();
    } else {
      // Ensure isPlaying reflects reality, but keep progress/seconds
      this.state.partialNext({ isPlaying: false });
      if (this.elementRef) {
        try {
          this.elementRef.pause();
        } catch {
          // ignore
        }
      }
    }
    if (this.elementRef) {
      this._pool.releaseElement(this.id);
      this.setRef(null);
    }
  }

  private elementIsReady = (): Promise<boolean> => {
    if (this._elementIsReadyPromise) return this._elementIsReadyPromise;

    this._elementIsReadyPromise = new Promise((resolve) => {
      if (!this.elementRef) return resolve(false);
      const element = this.elementRef;
      const handleLoaded = () => {
        element.removeEventListener('loadedmetadata', handleLoaded);
        resolve(element.readyState > 0);
      };
      element.addEventListener('loadedmetadata', handleLoaded);
    });

    return this._elementIsReadyPromise;
  };

  private setRef = (elementRef: HTMLAudioElement | null) => {
    if (elementIsPlaying(this.elementRef)) {
      // preserve state during swap
      this.releaseElement({ resetState: false });
    }
    this.clearPendingLoadedMeta();
    this._restoringPosition = false;
    this._elementIsReadyPromise = undefined;
    this.state.partialNext({ elementRef });
    // When a new element is attached, make sure listeners are wired to it
    if (elementRef) {
      this.registerSubscriptions();
    }
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

  canPlayMimeType = (mimeType: string) => {
    if (!mimeType) return false;
    if (this.elementRef) return !!this.elementRef.canPlayType(mimeType);
    return !!new Audio().canPlayType(mimeType);
  };

  play = async (params?: AudioPlayerPlayAudioParams) => {
    if (this._disposed) return;
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

    // Restore last known position for this player before attempting to play
    this.restoreSavedPosition(elementRef);

    elementRef.playbackRate = currentPlaybackRate ?? this.currentPlaybackRate;

    this.setPlaybackStartSafetyTimeout();

    try {
      await elementRef.play();
      this.state.partialNext({
        currentPlaybackRate,
        isPlaying: true,
        playbackRates,
      });
      this._pool.setActiveAudioPlayer(this);
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

  seek = throttle<SeekFn>(async ({ clientX, currentTarget }) => {
    let element = this.elementRef;
    if (!this.elementRef) {
      element = this.ensureElementRef();
      const isReady = await this.elementIsReady();
      if (!isReady) return;
    }
    if (!currentTarget || !element) return;
    if (!isSeekable(element)) {
      this.registerError({ errCode: 'seek-not-supported' });
      return;
    }

    const { width, x } = currentTarget.getBoundingClientRect();

    const ratio = (clientX - x) / width;
    if (ratio > 1 || ratio < 0) return;
    const currentTime = ratio * element.duration;
    this.setSecondsElapsed(currentTime);
    element.currentTime = currentTime;
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
    this._disposed = true;
    this.cancelScheduledRemoval();
    this.clearPendingLoadedMeta();
    this._restoringPosition = false;
    this.releaseElement({ resetState: true });
    this.unsubscribeEventListeners?.();
    this.unsubscribeEventListeners = null;
    this.plugins.forEach(({ onRemove }) => onRemove?.({ player: this }));
    this._pool.deregister(this.id);
  };

  cancelScheduledRemoval = () => {
    clearTimeout(this._removalTimeout);
    this._removalTimeout = undefined;
  };

  scheduleRemoval = (ms: number = 0) => {
    this.cancelScheduledRemoval();
    this._removalTimeout = setTimeout(() => {
      if (this.disposed) return;
      this.requestRemoval();
    }, ms);
  };

  /**
   * Releases only the underlying element back to the pool without disposing the player instance.
   * Used by the pool to hand off the shared element in single-playback mode.
   */
  releaseElementForHandoff = () => {
    if (!this.elementRef) return;
    this.releaseElement({ resetState: false });
    this.unsubscribeEventListeners?.();
    this.unsubscribeEventListeners = null;
  };

  registerSubscriptions = () => {
    this.unsubscribeEventListeners?.();

    const audioElement = this.elementRef;
    if (!audioElement) return;

    const handleEnded = () => {
      if (audioElement) {
        this.updateDurationFromElement(audioElement);
      }
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
      const t = audioElement?.currentTime ?? 0;
      // Ignore spurious zero during restore/handoff to avoid UI flicker
      if (this._restoringPosition && t === 0) return;
      // Also avoid regressing UI to zero if we already have non-zero progress and we're not playing
      if (!this.isPlaying && t === 0 && this.secondsElapsed > 0) return;
      this.setSecondsElapsed(t);
    };

    const handleLoadedMetadata = () => {
      if (audioElement) {
        this.updateDurationFromElement(audioElement);
      }
    };

    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('timeupdate', handleTimeupdate);

    this.unsubscribeEventListeners = () => {
      audioElement.pause();
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('timeupdate', handleTimeupdate);
    };
  };
}
