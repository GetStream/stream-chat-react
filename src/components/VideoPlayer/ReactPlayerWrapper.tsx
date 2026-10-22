import ReactPlayerImport from 'react-player';

import type { VideoPlayerProps } from './VideoPlayer';

// react-player is CJS with the component on `exports.default`. Some interop setups (e.g. Vite
// serving the built ESM as a linked workspace dependency) hand back the namespace `{ default }`,
// which makes React throw "Element type is invalid". Unwrap `default` when present.
const ReactPlayer =
  (ReactPlayerImport as unknown as { default?: typeof ReactPlayerImport }).default ??
  ReactPlayerImport;

/**
 * Default export so `VideoPlayer` can load it with `React.lazy`, keeping `react-player` (~2 MB)
 * out of the SDK's eager import graph until a default video player renders.
 */
const ReactPlayerWrapper = ({
  controls = true,
  isPlaying,
  thumbnailUrl,
  videoUrl,
}: VideoPlayerProps) => (
  <ReactPlayer
    className='react-player'
    config={{ file: { attributes: { poster: thumbnailUrl } } }}
    controls={controls}
    height='100%'
    playing={isPlaying}
    url={videoUrl}
    width='100%'
  />
);

export default ReactPlayerWrapper;
