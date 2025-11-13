import { AudioPlayer, type AudioPlayerOptions } from './AudioPlayer';
import { StateStore } from 'stream-chat';

export type AudioPlayerPoolState = {
  activeAudioPlayer: AudioPlayer | null;
};

export class AudioPlayerPool {
  state: StateStore<AudioPlayerPoolState> = new StateStore<AudioPlayerPoolState>({
    activeAudioPlayer: null,
  });
  private pool = new Map<string, AudioPlayer>();
  private audios = new Map<string, HTMLAudioElement>();
  private sharedAudio: HTMLAudioElement | null = null;
  private sharedOwnerId: string | null = null;
  private readonly allowConcurrentPlayback: boolean;

  constructor(config?: { allowConcurrentPlayback?: boolean }) {
    this.allowConcurrentPlayback = !!config?.allowConcurrentPlayback;
  }

  get players() {
    return Array.from(this.pool.values());
  }

  get activeAudioPlayer() {
    return this.state.getLatestValue().activeAudioPlayer;
  }

  getOrAdd = (params: Omit<AudioPlayerOptions, 'pool'>) => {
    let player = this.pool.get(params.id);
    if (player) {
      if (!player.disposed) return player;
      this.deregister(params.id);
    }
    player = new AudioPlayer({
      ...params,
      pool: this,
    });
    this.pool.set(params.id, player);
    return player;
  };

  /**
   * In case of allowConcurrentPlayback enabled, a new Audio is created and assigned to the given audioPlayer owner.
   * In case of disabled concurrency, the shared audio ownership is transferred to the new owner loading the owner's
   * source.
   *
   * @param ownerId
   * @param src
   */
  acquireElement = ({ ownerId, src }: { ownerId: string; src: string }) => {
    if (!this.allowConcurrentPlayback) {
      // Single shared element mode
      if (!this.sharedAudio) {
        this.sharedAudio = new Audio();
      }
      // Handoff from previous owner if different
      if (this.sharedOwnerId && this.sharedOwnerId !== ownerId) {
        const previous = this.pool.get(this.sharedOwnerId);
        // Ask previous to pause and drop ref, but keep player in pool
        previous?.pause();
        previous?.releaseElementForHandoff();
      }
      this.sharedOwnerId = ownerId;
      if (this.sharedAudio.src !== src) {
        // setting src starts loading; avoid explicit load() to prevent currentTime reset flicker
        this.sharedAudio.src = src;
      }
      return this.sharedAudio;
    }

    // Concurrent-per-owner mode
    let audio = this.audios.get(ownerId);
    if (!audio) {
      audio = new Audio();
      this.audios.set(ownerId, audio);
    }
    if (audio.src !== src) {
      // setting src starts loading; avoid explicit load() here as well
      audio.src = src;
    }
    return audio;
  };

  /**
   * Removes the given audio players ownership of the shared audio element (in case of concurrent playback is disabled)
   * and pauses the reproduction of the audio.
   * In case of concurrent playback mode (allowConcurrentPlayback enabled), the audio is paused,
   * its source cleared and removed from the audios pool readied for garbage collection.
   *
   * @param ownerId
   */
  releaseElement = (ownerId: string) => {
    if (!this.allowConcurrentPlayback) {
      if (this.sharedOwnerId !== ownerId) return;
      const el = this.sharedAudio;
      if (el) {
        try {
          el.pause();
        } catch {
          // ignore
        }
        el.removeAttribute('src');
        el.load();
      }
      // Keep shared element instance for reuse
      this.sharedOwnerId = null;
      return;
    }

    const el = this.audios.get(ownerId);
    if (!el) return;
    try {
      el.pause();
    } catch {
      // ignore
    }
    el.removeAttribute('src');
    el.load();
    this.audios.delete(ownerId);
  };

  /** Sets active audio player when allowConcurrentPlayback is disabled */
  setActiveAudioPlayer = (activeAudioPlayer: AudioPlayer | null) => {
    if (this.allowConcurrentPlayback) return;
    this.state.partialNext({ activeAudioPlayer });
  };

  /** Removes the AudioPlayer instance from the pool of players */
  deregister(id: string) {
    if (this.pool.has(id)) {
      this.pool.delete(id);
    }
    if (this.activeAudioPlayer?.id === id) {
      this.setActiveAudioPlayer(null);
    }
  }

  /** Performs all the necessary cleanup actions and removes the player from the pool */
  remove = (id: string) => {
    const player = this.pool.get(id);
    if (!player) return;
    player.requestRemoval();
  };

  /** Removes and cleans up all the players from the pool */
  clear = () => {
    this.players.forEach((player) => {
      this.remove(player.id);
    });
  };

  registerSubscriptions = () => {
    // Only register subscriptions for players that have an attached element.
    // Avoid creating elements or cross-wiring listeners on the shared element in single-playback mode.
    this.players.forEach((p) => {
      if (p.elementRef) {
        p.registerSubscriptions();
      }
    });
  };
}
