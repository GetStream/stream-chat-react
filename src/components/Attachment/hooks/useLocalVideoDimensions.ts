import { useEffect, useState } from 'react';
import { FixedSizeQueueCache, withoutConcurrency } from 'stream-chat';

export type LocalVideoDimensions = { height: number; width: number };

/**
 * Probing creates a media element, and browsers cap how many can exist at once (Chrome allows a
 * few dozen per page), so the rendered players of other attachments compete for the same budget.
 * Two guards keep this bounded no matter how many videos are in flight:
 *
 * - results are cached by source, so a blob is probed once even if its widget remounts (a
 *   virtualized list unmounts and remounts widgets as the user scrolls) or is rendered twice;
 * - probes run one at a time under a shared tag, so N uploading videos never hold N extra media
 *   elements open. Each is a metadata read off an in-memory blob, so the queue drains fast.
 */
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
      // An undecodable file reports 0x0 — no better than the CSS fallback.
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
 * Reads the intrinsic dimensions of a video that is not on the CDN yet.
 *
 * Sizing normally comes from the `oh`/`ow` parameters on the attachment's CDN `thumb_url`
 * (`getCssDimensionsVariables`). A video whose upload is still in flight has no `thumb_url`, so
 * the box falls back to `1000000x1000000` and lays out square — and then resizes the moment the
 * real dimensions arrive. The local file answers the same question without a network request.
 *
 * Returns `undefined` until the metadata is in, or if the file cannot be decoded.
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
