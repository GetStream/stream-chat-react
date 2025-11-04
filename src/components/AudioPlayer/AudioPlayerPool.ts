import {
  AudioPlayer,
  type AudioPlayerOptions,
  type AudioPlayerState,
  defaultRegisterAudioPlayerError,
} from './AudioPlayer';

export class AudioPlayerPool {
  pool = new Map<string, { player: AudioPlayer; unsubscribe?: () => void }>();

  getOrAdd = (params: AudioPlayerOptions) => {
    let player = this.pool.get(params.id)?.player;
    if (player) return player;
    player = new AudioPlayer(params);

    this.pool.set(params.id, {
      player,
      unsubscribe: this.registerSubscriptions(player),
    });
    return player;
  };

  remove = (id: string) => {
    const player = this.pool.get(id);
    if (!player) return;
    player.unsubscribe?.();
    player.player.stop();
    player.player.elementRef.src = '';
    player.player.elementRef.load();
    player.player.onRemove();
    this.pool.delete(id);
  };

  clear = () => {
    Array.from(this.pool.values()).forEach(({ player }) => {
      this.remove(player.id);
    });
  };

  registerSubscriptions = (player?: AudioPlayer) => {
    if (!player) {
      Array.from(this.pool.values()).forEach((p) => {
        this.registerSubscriptions(p.player);
      });
      return;
    }

    const poolPlayer = this.pool.get(player.id);

    poolPlayer?.unsubscribe?.();

    const audioElement = player.elementRef;

    const handleEnded = () => {
      player.state.partialNext({
        isPlaying: false,
        secondsElapsed: audioElement?.duration ?? player.durationSeconds ?? 0,
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
        player.state.partialNext(state);
        return;
      }

      if (audio.error.code === 4) {
        state.canPlayRecord = false;
        player.state.partialNext(state);
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
      player.setSecondsElapsed(audioElement?.currentTime);
    };

    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('timeupdate', handleTimeupdate);

    return () => {
      audioElement.pause();
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('timeupdate', handleTimeupdate);
    };
  };

  unregisterSubscriptions = (id?: string) => {
    if (!id) {
      Array.from(this.pool.values()).forEach(({ unsubscribe }) => unsubscribe?.());
      for (const { player } of this.pool.values()) {
        this.pool.set(player.id, { player });
      }
      return;
    }
    const player = this.pool.get(id);
    if (!player) return;

    player.unsubscribe?.();
    delete player.unsubscribe;
  };
}
