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
   * `true` once every byte has been sent but the server has not answered yet. Browser upload
   * progress counts bytes written to the connection, so it reaches 100% before the server
   * confirms; the indicator is indeterminate in that window.
   */
  uploadConfirmationPending: boolean;
  /** `true` only while `client.uploadManager` holds a live record for one of the attachments. */
  isUploading: boolean;
  /**
   * 0-100 while uploading and the transfer length is known, `undefined` otherwise. For several
   * attachments, their mean.
   */
  progress?: number;
};

/** Marks an ID without a live record in the joined selector key. */
const NO_RECORD = '-';

/**
 * `UploadRecord` with `uploadConfirmationPending` optional, for a `stream-chat` older than v9.51
 * whose records lack it; {@link useAttachmentsUploadState} then infers it.
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
 * Reports whether a request for any of the attachments is in flight right now, and how far along
 * it is.
 *
 * The source of truth is `client.uploadManager`, which holds a record only while the request runs.
 * Attachments returned by the API have no `localMetadata`, so they never match and the upload UI
 * stays off for sent messages. A pending `localMetadata.uploadState` only selects candidates: a
 * message that outlives its request (aborted upload, `disconnectUser`, a stale state from an
 * offline store) shows no progress because it has no live record. `localMetadata.uploadProgress`
 * is only a fallback for the progress number.
 *
 * @param attachments - Attachments to track. Ones that are not pending uploads are ignored.
 * @returns The combined upload state of the attachments.
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
      // A joined string rather than an array: useStateStore shallow-compares the selected keys,
      // so a fresh array would never compare equal. Per ID: `-` without a live record, else
      // `<progress>:<uploadConfirmationPending>`.
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

  // A record exists only while the request runs: that, not the message payload, means "uploading".
  const entries = (recordsKey?.split(',') ?? []).map((entry, index) => {
    if (entry === NO_RECORD) return undefined;

    const [reportedProgress, reportedAwaiting] = entry.split(':');
    const progress =
      reportedProgress === '' ? pending[index].uploadProgress : Number(reportedProgress);

    return {
      progress,
      // Prefer the explicit `UploadRecord.uploadConfirmationPending`. Without it the record is
      // still live, so 100% can only mean all bytes are sent and confirmation is pending.
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

// The composer side reads the flag `AttachmentManager` mirrors into `localMetadata`, through
// `isUploadConfirmationPending` from `stream-chat`. On a message that mirrored value is a frozen
// snapshot, which is why `useAttachmentsUploadState` reads the live record instead.
