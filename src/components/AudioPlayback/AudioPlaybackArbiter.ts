import { StateStore } from '@stream-io/state-store';
import type { AudioPlayer } from './AudioPlayer';

export type AudioPlaybackArbiterState = {
  activeAudioPlayer: AudioPlayer | null;
};

/**
 * Decides which player may play across every {@link AudioPlayerPool} that shares it, and owns the
 * single `Audio` element they take turns on: starting a player pauses the previous holder.
 * Exclusivity lives here, not in a pool, because each surface (`Channel`, `Thread`) mounts its own
 * pool. One reused element also keeps playback working on iOS, where an element must be unlocked
 * by a user gesture before it can be played programmatically.
 */
export class AudioPlaybackArbiter {
  state = new StateStore<AudioPlaybackArbiterState>({ activeAudioPlayer: null });

  private element: HTMLAudioElement | null = null;
  private owner: AudioPlayer | null = null;

  get activeAudioPlayer() {
    return this.state.getLatestValue().activeAudioPlayer;
  }

  /**
   * Hands the shared element to `owner`, pausing the previous holder, and loads `src` into it.
   * @param params.owner - Player that takes the element.
   * @param params.src - Audio source to load. Only assigned when it differs from the current one.
   * @returns The shared element.
   */
  acquire = ({ owner, src }: { owner: AudioPlayer; src: string }) => {
    if (!this.element) {
      this.element = new Audio();
    }

    if (this.owner && this.owner !== owner) {
      // Pause and drop the reference, but leave the player registered in its own pool.
      this.owner.pause();
      this.owner.releaseElementForHandoff();
    }
    this.owner = owner;

    if (this.element.src !== src) {
      // Setting `src` starts loading; an explicit load() would reset currentTime and flicker.
      this.element.src = src;
    }
    return this.element;
  };

  /**
   * Drops `owner`'s claim on the shared element and pauses it. Ignored when `owner` is not the
   * current holder, so a player torn down in the background cannot stop its successor.
   * @param owner - Player releasing the element.
   */
  release = (owner: AudioPlayer) => {
    if (this.owner !== owner) return;
    if (this.element) {
      try {
        this.element.pause();
      } catch {
        // ignore
      }
      this.element.removeAttribute('src');
      this.element.load();
    }
    // Keep the element instance for reuse
    this.owner = null;
  };

  setActivePlayer = (activeAudioPlayer: AudioPlayer | null) => {
    this.state.partialNext({ activeAudioPlayer });
  };
}
