import ReactPlayerImport from 'react-player';

import type { VideoPlayerProps } from './VideoPlayer';

// react-player ships as CJS with the component on `exports.default`. Some
// bundler/interop setups (e.g. Vite serving our built ESM as a linked workspace
// dependency) hand back the module namespace `{ default }` instead of the
// component itself, which makes React throw "Element type is invalid ... got:
// object". Unwrap the default defensively so it works regardless of interop.
const ReactPlayer =
  (ReactPlayerImport as unknown as { default?: typeof ReactPlayerImport }).default ??
  ReactPlayerImport;

/**
 * Default-exported so `VideoPlayer` can code-split it via `React.lazy`, keeping
 * `react-player` (~2 MB) out of the SDK's eager import graph — it is fetched
 * only when a default video player actually renders.
 */
const ReactPlayerWrapper = ({ isPlaying, thumbnailUrl, videoUrl }: VideoPlayerProps) => (
  <ReactPlayer
    className='react-player'
    config={{ file: { attributes: { poster: thumbnailUrl } } }}
    controls
    height='100%'
    playing={isPlaying}
    url={videoUrl}
    width='100%'
  />
);

export default ReactPlayerWrapper;
