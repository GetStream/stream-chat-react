import { StateStore } from '@stream-io/state-store';
import type { AudioPlayer } from './AudioPlayer';

export type AudioPlaybackArbiterState = {
  activeAudioPlayer: AudioPlayer | null;
};

/**
 * Decides who is allowed to play, across every {@link AudioPlayerPool} that shares it.
 *
 * It owns the single `Audio` element and hands ownership between players: starting one pauses
 * whoever held the element. Exclusivity has to live here rather than in the pool because a pool is
 * scoped to a surface -- `Channel` and `Thread` each mount their own -- and two voice messages
 * playing over each other is exactly what happens when each surface arbitrates for itself.
 *
 * Reusing one element is also what keeps playback working on iOS, where an element must be unlocked
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
      // setting src starts loading; avoid explicit load() to prevent currentTime reset flicker
      this.element.src = src;
    }
    return this.element;
  };

  /**
   * Drops `owner`'s claim on the shared element and pauses it. A release from anyone who is not the
   * current holder is ignored, so a player torn down in the background cannot stop the one that has
   * since taken over.
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
