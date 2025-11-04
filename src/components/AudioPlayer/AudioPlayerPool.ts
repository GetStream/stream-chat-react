import { AudioPlayer, type AudioPlayerOptions } from './AudioPlayer';

export class AudioPlayerPool {
  pool = new Map<string, AudioPlayer>();

  get players() {
    return Array.from(this.pool.values());
  }

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
    this.players.forEach((player) => {
      this.remove(player.id);
    });
  };

  registerSubscriptions = () => {
    this.players.forEach((p) => {
      p.registerSubscriptions();
    });
  };
}
