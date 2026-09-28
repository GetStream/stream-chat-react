export * from './AudioPlayer';
export * from './components';
export * from './plugins';
// `SharedAudioPlaybackProvider` and `AudioPlaybackArbiter` are deliberately not exported. `Chat`
// mounts the provider, and an arbiter is only ever consumed by `AudioPlayerPool`, which is internal
// -- exporting them would publish names nothing public can accept.
export {
  useActiveAudioPlayer,
  useAudioPlayer,
  type UseAudioPlayerProps,
  type WithAudioPlaybackProps,
  WithAudioPlayback,
} from './WithAudioPlayback';
