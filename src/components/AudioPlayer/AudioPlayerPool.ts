import { AudioPlayer, type AudioPlayerOptions } from './AudioPlayer';
import { audioPlayerRequestRemovalFromPoolPluginFactory } from './plugins/AudioPlayerRequestRemovalPlugin';

export class AudioPlayerPool {
  pool = new Map<string, AudioPlayer>();

  get players() {
    return Array.from(this.pool.values());
  }

  getOrAdd = (params: AudioPlayerOptions) => {
    let player = this.pool.get(params.id);
    if (player) return player;
    const requestRemovalPlugin = audioPlayerRequestRemovalFromPoolPluginFactory({
      players: this,
    });
    player = new AudioPlayer({
      ...params,
      plugins: [
        ...(params.plugins ?? []).filter((p) => p.id !== requestRemovalPlugin.id),
        requestRemovalPlugin,
      ],
    });
    player.registerSubscriptions();
    this.pool.set(params.id, player);
    return player;
  };

  remove = (id: string) => {
    const player = this.pool.get(id);
    if (!player) return;
    player.requestRemoval();
    if (this.pool.has(id)) {
      this.pool.delete(id);
    }
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
