import type { AudioPlayerPlugin } from './AudioPlayerPlugin';
import type { AudioPlayerPool } from '../AudioPlayerPool';

export const audioPlayerRequestRemovalFromPoolPluginFactory = ({
  players,
}: {
  players: AudioPlayerPool;
}): AudioPlayerPlugin => ({
  id: 'AudioPlayerRequestRemovalFromPoolPlugin',
  onRemove: ({ player }) => {
    players.pool.delete(player.id);
  },
});
