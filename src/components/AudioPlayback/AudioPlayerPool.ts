import { AudioPlayer, type AudioPlayerOptions } from './AudioPlayer';
import { AudioPlaybackArbiter } from './AudioPlaybackArbiter';
import type { AudioPlaybackArbiterState } from './AudioPlaybackArbiter';

export type AudioPlayerPoolState = AudioPlaybackArbiterState;

export type AudioPlayerPoolOptions = {
  /**
   * Decides which player may play, and owns the element they share. Pools given the same arbiter
   * cannot play over each other -- which is how `Channel` and `Thread`, each with their own pool,
   * stay exclusive. Left out, the pool arbitrates alone.
   */
  arbiter?: AudioPlaybackArbiter;
};

export class AudioPlayerPool {
  private pool = new Map<string, AudioPlayer>();
  private readonly arbiter: AudioPlaybackArbiter;

  constructor({ arbiter }: AudioPlayerPoolOptions = {}) {
    this.arbiter = arbiter ?? new AudioPlaybackArbiter();
  }

  /** Playback state is the arbiter's, so every pool sharing one reports the same active player. */
  get state() {
    return this.arbiter.state;
  }

  get players() {
    return Array.from(this.pool.values());
  }

  get activeAudioPlayer() {
    return this.arbiter.activeAudioPlayer;
  }

  getOrAdd = (params: Omit<AudioPlayerOptions, 'pool'>) => {
    const { playbackRates, plugins, ...descriptor } = params;
    let player = this.pool.get(params.id);
    if (player) {
      if (!player.disposed) {
        player.setDescriptor(descriptor);
        return player;
      }
      this.deregister(params.id);
    }
    player = new AudioPlayer({
      playbackRates,
      plugins,
      ...descriptor,
      pool: this,
    });
    this.pool.set(params.id, player);
    return player;
  };

  /** @see {@link AudioPlaybackArbiter.acquire} */
  acquireElement = ({ owner, src }: { owner: AudioPlayer; src: string }) =>
    this.arbiter.acquire({ owner, src });

  /** @see {@link AudioPlaybackArbiter.release} */
  releaseElement = (owner: AudioPlayer) => this.arbiter.release(owner);

  setActiveAudioPlayer = (activeAudioPlayer: AudioPlayer | null) =>
    this.arbiter.setActivePlayer(activeAudioPlayer);

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
    // Only register subscriptions for players that have an attached element -- every other player
    // would otherwise cross-wire listeners onto the shared element it does not currently own.
    this.players.forEach((p) => {
      if (p.elementRef) {
        p.registerSubscriptions();
      }
    });
  };
}
