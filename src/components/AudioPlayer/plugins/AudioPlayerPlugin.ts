import type { AudioPlayer, RegisterAudioPlayerErrorParams } from '../AudioPlayer';

export type AudioPlayerPluginContext = {
  player: AudioPlayer;
};

export type AudioPlayerPlugin = {
  id: string;
  onInit?(ctx: AudioPlayerPluginContext): void;
  onError?(ctx: AudioPlayerPluginContext & RegisterAudioPlayerErrorParams): void;
  onRemove?(ctx: AudioPlayerPluginContext): void;
};
