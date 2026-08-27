import type { MessageComposer, UploadRequestOptions } from 'stream-chat';
import type { FileLike, FileReference } from 'stream-chat';

/**
 * Dev-only harness that stretches every upload over a configurable delay, so the in-flight and
 * confirmation-pending windows last long enough to see.
 *
 * Without it there is nothing to look at — this app's Stream project caps uploads at 3 MiB,
 * which lands in well under a second.
 *
 * The delay comes from **Settings → Composer → "Slow upload delay"** and only applies while
 * "Allow sending while attachments are still uploading" is on; see `App.tsx`.
 *
 * Caveat: installing a custom `doUploadRequest` flips `hasCustomDoUploadRequest`, which slightly
 * changes the guard in `uploadFiles`. Irrelevant for the demo, but it is why the harness is
 * installed only once the mode is armed rather than unconditionally.
 */
const PROGRESS_STEPS = 20;
/**
 * Share of the delay spent streaming bytes; the rest simulates the server thinking after the
 * last byte was sent. That second phase is the whole point — progress reports 100 while the
 * response is still outstanding, which is what `UploadRecord.uploadConfirmationPending` marks and what
 * makes the indicator go indeterminate.
 */
const RAMP_SHARE = 0.6;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const installSlowUploadHarness = (
  composer: MessageComposer,
  /**
   * Read at call time, not at install time. A custom `doUploadRequest` cannot be un-set —
   * `MessageComposer.updateConfig` merges via `mergeWith`, which skips `undefined` — so the
   * harness stays installed for the session and instead consults the current delay on every
   * upload. `0` makes it a pass-through.
   */
  getDelayMs: () => number,
) => {
  composer.attachmentManager.setCustomUploadFn(
    async (fileLike: FileReference | FileLike, options?: UploadRequestOptions) => {
      const delayMs = getDelayMs();
      if (delayMs <= 0) {
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
      await sleep(delayMs - rampMs);
      if (options?.abortSignal?.aborted) {
        throw new DOMException('Upload aborted', 'AbortError');
      }

      return composer.attachmentManager.doDefaultUploadRequest(fileLike, options);
    },
  );
};
