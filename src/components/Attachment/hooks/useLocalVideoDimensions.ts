import { useEffect, useState } from 'react';
import { FixedSizeQueueCache, withoutConcurrency } from 'stream-chat';

export type LocalVideoDimensions = { height: number; width: number };

// Probing creates a media element and browsers cap how many can exist at once, so probes are
// bounded: results are cached by source (widgets remount in virtualized lists), and probes run one
// at a time under a shared tag so uploading videos never hold many extra media elements open.
const dimensionsBySource = new FixedSizeQueueCache<string, LocalVideoDimensions>(100);
const PROBE_TAG = 'stream-chat-react/local-video-dimensions';
/** A file the browser cannot decode never fires `loadedmetadata`; do not block the queue on it. */
const PROBE_TIMEOUT_MS = 5000;

const probeDimensions = (src: string) =>
  new Promise<LocalVideoDimensions | undefined>((resolve) => {
    const probe = document.createElement('video');

    const finish = (dimensions?: LocalVideoDimensions) => {
      clearTimeout(timeout);
      probe.removeEventListener('loadedmetadata', handleLoadedMetadata);
      probe.removeEventListener('error', handleError);
      // Detach the source so the element stops holding the blob and frees its media slot.
      probe.removeAttribute('src');
      probe.load();
      resolve(dimensions);
    };

    const handleLoadedMetadata = () => {
      const { videoHeight, videoWidth } = probe;
      // An undecodable file reports 0x0, no better than the CSS fallback.
      finish(
        videoWidth > 0 && videoHeight > 0
          ? { height: videoHeight, width: videoWidth }
          : undefined,
      );
    };
    const handleError = () => finish();

    const timeout = setTimeout(handleError, PROBE_TIMEOUT_MS);
    probe.addEventListener('loadedmetadata', handleLoadedMetadata);
    probe.addEventListener('error', handleError);
    probe.preload = 'metadata';
    probe.src = src;
  });

/**
 * Reads the intrinsic dimensions of a video that is not on the CDN yet. Sizing otherwise comes
 * from the `oh`/`ow` parameters of the CDN `thumb_url`, which an uploading video lacks, so its
 * box would lay out from the `1000000x1000000` fallback and resize later.
 *
 * @param src - Local video URL, e.g. a blob URL. No dimensions are read when undefined.
 * @returns The dimensions, or `undefined` until the metadata is in or if decoding fails.
 */
export const useLocalVideoDimensions = (src?: string) => {
  const [dimensions, setDimensions] = useState<LocalVideoDimensions | undefined>(() =>
    src ? dimensionsBySource.get(src) : undefined,
  );

  useEffect(() => {
    if (!src) {
      setDimensions(undefined);
      return;
    }

    const cached = dimensionsBySource.get(src);
    if (cached) {
      setDimensions(cached);
      return;
    }

    let cancelled = false;

    withoutConcurrency(PROBE_TAG, async () => {
      // Another widget may have probed this source while this one waited its turn.
      const resolved = dimensionsBySource.get(src) ?? (await probeDimensions(src));

      if (resolved) dimensionsBySource.add(src, resolved);
      if (!cancelled) setDimensions(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return dimensions;
};
