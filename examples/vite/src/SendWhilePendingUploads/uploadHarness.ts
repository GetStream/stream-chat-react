import type { MessageComposer, UploadRequestOptions } from 'stream-chat';
import type { FileLike, FileReference } from 'stream-chat';

/** Files whose name starts with this fail when the failure mode is `prefixed`. */
export const FAILING_FILE_NAME_PREFIX = 'fail-';

export type UploadFailureMode = 'off' | 'all' | 'prefixed';

export type UploadHarnessSettings = {
  /** Milliseconds every upload is stretched over. `0` uploads at full speed. */
  delayMs: number;
  /** Which uploads should reject instead of completing. */
  failureMode: UploadFailureMode;
};

/**
 * Dev-only harness wrapping `doUploadRequest`, so uploads can be slowed down and made to fail on
 * demand from **Settings → Composer**.
 *
 * Without the delay there is nothing to look at: this app's Stream project caps uploads at 3 MiB,
 * which lands in well under a second. Without the failure switch there is no way to reach the
 * failed-message and retry paths from the UI.
 *
 * Both live in one function because a custom `doUploadRequest` cannot be un-set —
 * `MessageComposer.updateConfig` merges via `mergeWith`, which skips `undefined` — and the
 * attachment manager holds only one. So the harness is installed once and reads the current
 * settings on every upload; with the delay at `0` and failures off it is a pass-through.
 *
 * Caveat: installing a custom `doUploadRequest` flips `hasCustomDoUploadRequest`, which slightly
 * changes the guard in `uploadFiles`. Irrelevant for the demo, but it is why the harness is
 * installed only once one of the switches is armed rather than unconditionally.
 */
const PROGRESS_STEPS = 20;
/**
 * Share of the delay spent streaming bytes; the rest simulates the server thinking after the
 * last byte was sent. That second phase is the whole point — progress reports 100 while the
 * response is still outstanding, which is what `UploadRecord.uploadConfirmationPending` marks and
 * what makes the indicator go indeterminate.
 */
const RAMP_SHARE = 0.6;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const getFileName = (fileLike: FileReference | FileLike) =>
  'name' in fileLike && typeof fileLike.name === 'string' ? fileLike.name : '';

const shouldFail = (fileLike: FileReference | FileLike, mode: UploadFailureMode) => {
  if (mode === 'all') return true;
  if (mode === 'prefixed') {
    return getFileName(fileLike).startsWith(FAILING_FILE_NAME_PREFIX);
  }
  return false;
};

export const installUploadHarness = (
  composer: MessageComposer,
  /**
   * Read at call time, not at install time, so changing either setting takes effect on the next
   * upload without re-running the composer setup.
   */
  getSettings: () => UploadHarnessSettings,
) => {
  composer.attachmentManager.setCustomUploadFn(
    async (fileLike: FileReference | FileLike, options?: UploadRequestOptions) => {
      const { delayMs, failureMode } = getSettings();
      const failing = shouldFail(fileLike, failureMode);

      if (delayMs <= 0) {
        if (failing) throw new Error('Simulated upload failure');
        return composer.attachmentManager.doDefaultUploadRequest(fileLike, options);
      }

      const rampMs = delayMs * RAMP_SHARE;
      const stepMs = rampMs / PROGRESS_STEPS;

      // Phase 1 — bytes going out over the wire.
      for (let step = 1; step <= PROGRESS_STEPS; step += 1) {
        await sleep(stepMs);
        if (options?.abortSignal?.aborted) {
          throw new DOMException('Upload aborted', 'AbortError');
        }
        options?.onProgress?.(Math.round((step / PROGRESS_STEPS) * 100));
      }

      // Phase 2 — every byte is sent and progress reads 100, but the server has not answered.
      // A failing upload rejects here rather than at the start, so there is time to send the
      // message while the upload is still running and watch it fail afterwards.
      await sleep(delayMs - rampMs);
      if (options?.abortSignal?.aborted) {
        throw new DOMException('Upload aborted', 'AbortError');
      }
      if (failing) throw new Error('Simulated upload failure');

      return composer.attachmentManager.doDefaultUploadRequest(fileLike, options);
    },
  );
};
