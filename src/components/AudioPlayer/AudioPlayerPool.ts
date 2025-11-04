import { AudioPlayer, type AudioPlayerOptions } from './AudioPlayer';

export class AudioPlayerPool {
  pool = new Map<string, AudioPlayer>();

  getOrAdd = (params: AudioPlayerOptions) => {
    let player = this.pool.get(params.id);
    if (player) return player;
    player = new AudioPlayer(params);
    player.registerSubscriptions();
    this.pool.set(params.id, player);
    return player;
  };

  remove = (id: string) => {
    const player = this.pool.get(id);
    if (!player) return;
    player.stop();
    player.elementRef.src = '';
    player.elementRef.load();
    player.onRemove();
    this.pool.delete(id);
  };

  clear = () => {
    Array.from(this.pool.values()).forEach((player) => {
      this.remove(player.id);
    });
  };

  registerSubscriptions = () => {
    Array.from(this.pool.values()).forEach((p) => {
      p.registerSubscriptions();
    });
  };
}
