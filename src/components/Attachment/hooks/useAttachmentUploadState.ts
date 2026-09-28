import { useCallback, useMemo } from 'react';
import { isPendingUpload } from 'stream-chat';
import type {
  Attachment,
  LocalAttachment,
  SharedLocationResponse,
  UploadManagerState,
} from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useStateStore } from '../../../store';

export type AttachmentUploadState = {
  /**
   * `true` once every byte has been handed to the socket but the server has not answered yet.
   *
   * Browser upload progress measures bytes *written to the connection*, not bytes the server
   * acknowledged, so it reaches 100% the instant the request body is flushed — then the
   * connection sits idle while the CDN ingests the file and the response travels back. On a
   * large file over a slow link that dead zone is long, and a bar parked at 100% claims the
   * upload is done when nothing is confirmed. Nothing measurable is happening during it, so the
   * honest rendering is indeterminate.
   */
  uploadConfirmationPending: boolean;
  /**
   * `true` only while `client.uploadManager` holds a live record for at least one of the
   * attachments — i.e. a request really is in flight right now.
   */
  isUploading: boolean;
  /**
   * 0–100 while uploading and the transfer length is known; `undefined` otherwise. For several
   * attachments this is their mean, so a gallery shows one combined bar.
   */
  progress?: number;
};

/** Sentinel for "no live record for this id" inside the joined selector key. */
const NO_RECORD = '-';

/**
 * `UploadRecord.uploadConfirmationPending` was added in stream-chat v9.51 — see the field's docs there.
 * Widened locally so this SDK still compiles against an older resolved `stream-chat`, in which
 * case the flag is absent and {@link useAttachmentsUploadState} infers it instead.
 */
type UploadRecordWithConfirmationPending = {
  uploadConfirmationPending?: boolean;
  uploadProgress?: number;
};

const emptyUploadState: AttachmentUploadState = {
  isUploading: false,
  uploadConfirmationPending: false,
};

/**
 * Reports whether a request for any of these attachments is in flight *right now*, and how far
 * along it is.
 *
 * The source of truth is `client.uploadManager`, which holds a record only for the lifetime of
 * the request. That has two consequences worth knowing:
 *
 * 1. **The UI is opt-in by construction.** An integration that never hands still-uploading
 *    attachments to a message never has a message referencing a live record, so none of the
 *    upload-progress UI ever renders — no config flag needed. Attachments returned by the API
 *    carry no `localMetadata` at all and can never match.
 *
 * 2. **No phantom progress.** A message can outlive its request — the upload was aborted,
 *    `disconnectUser` called `uploadManager.reset()`, or the message was rehydrated from an
 *    offline store with a stale `localMetadata.uploadState`. Keying off the frozen state would
 *    leave such an attachment showing an indeterminate spinner forever; keying off the live
 *    record makes it self-healing.
 *
 * `localMetadata.uploadProgress` is only a fallback for the progress *number*, never for
 * deciding whether an upload is running.
 */
export const useAttachmentsUploadState = (
  attachments: (Attachment | LocalAttachment | SharedLocationResponse | undefined)[],
): AttachmentUploadState => {
  const { client } = useChatContext();

  const pending = useMemo(
    () => attachments.filter(isPendingUpload).map((a) => a.localMetadata),
    [attachments],
  );
  // Stable primitive so the selector identity does not change on every render.
  const pendingIdsKey = pending.map(({ id }) => id).join(',');

  const selector = useCallback(
    (state: UploadManagerState) => ({
      // One joined string rather than an array: useStateStore shallow-compares the selected
      // keys, and a fresh array would compare unequal on every store update.
      // Per id: `-` when there is no live record, else `<progress>:<uploadConfirmationPending>`.
      recordsKey: pendingIdsKey
        .split(',')
        .map((id) => {
          const record = state.uploads[id] as
            | UploadRecordWithConfirmationPending
            | undefined;
          if (!record) return NO_RECORD;

          const awaiting =
            record.uploadConfirmationPending === undefined
              ? ''
              : record.uploadConfirmationPending
                ? '1'
                : '0';

          return `${record.uploadProgress ?? ''}:${awaiting}`;
        })
        .join(','),
    }),
    [pendingIdsKey],
  );

  // `client` is absent when rendered outside <Chat>; useStateStore tolerates an undefined store.
  const { recordsKey } = useStateStore(client?.uploadManager?.state, selector) ?? {};

  if (!pending.length) return emptyUploadState;

  // A record exists only while the request runs — that, not the message payload, is what
  // "uploading" means here.
  const entries = (recordsKey?.split(',') ?? []).map((entry, index) => {
    if (entry === NO_RECORD) return undefined;

    const [reportedProgress, reportedAwaiting] = entry.split(':');
    const progress =
      reportedProgress === '' ? pending[index].uploadProgress : Number(reportedProgress);

    return {
      progress,
      // Prefer the explicit signal from `UploadRecord.uploadConfirmationPending`. It is absent
      // when the resolved `stream-chat` predates it, so fall back to inferring the same thing:
      // the record is still live, therefore 100% can only mean "all bytes sent, confirmation
      // still pending".
      uploadConfirmationPending:
        reportedAwaiting === ''
          ? progress !== undefined && progress >= 100
          : reportedAwaiting === '1',
    };
  });

  const liveEntries = entries.filter((entry) => !!entry);
  if (!liveEntries.length) return emptyUploadState;

  const values = liveEntries.map(({ progress }) => progress);
  const known = values.filter((value): value is number => typeof value === 'number');

  return {
    isUploading: true,
    // Only report a number once every pending upload has one, so the bar does not jump between
    // determinate and indeterminate mid-flight.
    progress:
      known.length === values.length && known.length
        ? Math.round(known.reduce((sum, value) => sum + value, 0) / known.length)
        : undefined,
    uploadConfirmationPending: liveEntries.some(
      ({ uploadConfirmationPending }) => uploadConfirmationPending,
    ),
  };
};

/** Single-attachment convenience wrapper around {@link useAttachmentsUploadState}. */
export const useAttachmentUploadState = (
  attachment?: Attachment | LocalAttachment | SharedLocationResponse,
): AttachmentUploadState =>
  useAttachmentsUploadState(useMemo(() => [attachment], [attachment]));

/**
 * Whether an attachment is in the window where every byte has been sent but the server has not
 * confirmed — read straight off `localMetadata`.
 *
 * This is the composer-side counterpart to {@link useAttachmentsUploadState}: for an attachment
 * still held by the composer, `AttachmentManager` mirrors the live `UploadRecord` into
 * `localMetadata`, so no store subscription is needed. On a *message* the mirrored value is a
 * frozen snapshot, which is why the message side reads the record instead.
 *
 * Falls back to inferring the window from a 100% reading when `uploadConfirmationPending` is absent,
 * i.e. against a resolved `stream-chat` older than v9.51.
 */
