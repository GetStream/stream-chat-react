export * from './AudioPlayer';
export * from './components';
export * from './plugins';
// `SharedAudioPlaybackProvider` and `AudioPlaybackArbiter` are not exported: `Chat` mounts the
// provider, and only the internal `AudioPlayerPool` consumes an arbiter.
export {
  useActiveAudioPlayer,
  useAudioPlayer,
  type UseAudioPlayerProps,
  type WithAudioPlaybackProps,
  WithAudioPlayback,
} from './WithAudioPlayback';
