import {
  type APIErrorResponse,
  type ChannelState,
  ErrorFromResponse,
  isLocalImageAttachment,
  isPendingUpload,
  type LocalMessage,
  type LocalNotImageAttachment,
  type LocalUploadAttachment,
  type MessageResponse,
  type MinimumUploadRequestResult,
  type StreamChat,
} from 'stream-chat';

/** Writes the resolved URL onto the attachment and releases its local preview. */
const applyUploadResult = (
  attachment: LocalUploadAttachment,
  response: MinimumUploadRequestResult,
) => {
  const enriched: LocalUploadAttachment = { ...attachment };

  // Narrow on the copy, not the original, so the assignment type-checks.
  if (isLocalImageAttachment(enriched)) {
    enriched.image_url = response.file;
  } else {
    (enriched as LocalNotImageAttachment).asset_url = response.file;
  }
  if (response.thumb_url) {
    (enriched as LocalNotImageAttachment).thumb_url = response.thumb_url;
  }

  // The message has owned this preview since the composition was handed over — see
  // `createPostUploadAttachmentEnrichmentMiddleware`, which stops revoking once the composer
  // no longer holds the attachment.
  const { previewUri } = attachment.localMetadata;
  if (previewUri?.startsWith('blob:')) URL.revokeObjectURL?.(previewUri);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit-by-destructure
  const { localMetadata, ...rest } = enriched;
  return rest;
};

/**
 * Utility function for jumpToFirstUnreadMessage
 * @param targetId
 * @param msgSet
 */
export const findInMsgSetById = (
  targetId: string,
  msgSet: ReturnType<ChannelState['formatMessage']>[],
) => {
  for (let i = msgSet.length - 1; i >= 0; i--) {
    const item = msgSet[i];
    if (item.id === targetId) {
      return {
        index: i,
        target: item,
      };
    }
  }
  return {
    index: -1,
  };
};

/**
 * Utility function for jumpToFirstUnreadMessage
 * @param targetDate
 * @param msgSet
 * @param exact
 */
export const findInMsgSetByDate = (
  targetDate: Date,
  msgSet: MessageResponse[] | ReturnType<ChannelState['formatMessage']>[],
  exact = false,
) => {
  const targetTimestamp = targetDate.getTime();
  let left = 0;
  let middle = 0;
  let right = msgSet.length - 1;
  while (left <= right) {
    middle = Math.floor((right + left) / 2);
    const middleTimestamp = new Date(
      msgSet[middle].created_at as string | Date,
    ).getTime();
    const middleLeftTimestamp =
      msgSet[middle - 1]?.created_at &&
      new Date(msgSet[middle - 1].created_at as string | Date).getTime();
    const middleRightTimestamp =
      msgSet[middle + 1]?.created_at &&
      new Date(msgSet[middle + 1].created_at as string | Date).getTime();
    if (
      middleTimestamp === targetTimestamp ||
      (middleLeftTimestamp &&
        middleRightTimestamp &&
        middleLeftTimestamp < targetTimestamp &&
        targetTimestamp < middleRightTimestamp)
    ) {
      return { index: middle, target: msgSet[middle] };
    }
    if (middleTimestamp < targetTimestamp) left = middle + 1;
    else right = middle - 1;
  }

  if (
    !exact ||
    new Date(msgSet[left].created_at as string | Date).getTime() === targetTimestamp
  ) {
    return { index: left, target: msgSet[left] };
  }
  return { index: -1 };
};
/**
 * Compatibility adapter:
 * LocalMessage.error expects ErrorFromResponse<APIErrorResponse>, but some transport failures
 * (for example Axios ERR_NETWORK while offline) do not have an HTTP response payload.
 */
export const adaptMessageSendErrorToErrorFromResponse = (
  error: unknown,
): ErrorFromResponse<APIErrorResponse> => {
  if (error instanceof ErrorFromResponse) {
    return error;
  }

  const fallbackMessage = error instanceof Error ? error.message : 'Message send failed';
  let message = fallbackMessage;
  let status = 0;
  let code: number | null = null;

  if (typeof error === 'object' && error !== null) {
    const maybeAxiosError = error as {
      code?: unknown;
      message?: unknown;
      name?: unknown;
      response?: ErrorFromResponse<APIErrorResponse>['response'];
      status?: unknown;
    };

    if (maybeAxiosError.name === 'AxiosError' && maybeAxiosError.code === 'ERR_NETWORK') {
      message =
        typeof maybeAxiosError.message === 'string'
          ? maybeAxiosError.message
          : 'Network Error';
      status = maybeAxiosError.response?.status ?? 0;

      return new ErrorFromResponse<APIErrorResponse>(message, {
        code: null,
        response:
          maybeAxiosError.response ??
          ({
            // Compatibility shim: this is an intentionally incomplete AxiosResponse-like object.
            data: {
              duration: '',
              message,
              more_info: '',
              StatusCode: status,
            },
            status,
          } as ErrorFromResponse<APIErrorResponse>['response']),
        status,
      });
    }

    try {
      // error response isn't usable so needs to be stringified then parsed
      const stringError = JSON.stringify(error);
      const parsedError = stringError
        ? (JSON.parse(stringError) as Record<string, unknown>)
        : {};

      if (typeof parsedError.message === 'string') {
        message = parsedError.message;
      }
      if (typeof parsedError.status === 'number') {
        status = parsedError.status;
      }
      if (typeof parsedError.code === 'number') {
        code = parsedError.code;
      }
    } catch {
      // keep fallback values
    }
  }

  return new ErrorFromResponse<APIErrorResponse>(message, {
    code,
    response: {
      // Compatibility shim: this is an intentionally incomplete AxiosResponse-like object.
      data: {
        duration: '',
        message,
        more_info: '',
        StatusCode: status,
      },
      status,
    } as ErrorFromResponse<APIErrorResponse>['response'],
    status,
  });
};

/**
 * Settles the uploads of any attachment that is still in flight, and reports the outcome.
 *
 * A message only ever reaches the send path with a pending attachment when
 * `createSendWithPendingUploadsAttachmentsMiddleware` is installed — the default composition
 * middleware discards such a composition instead. `UploadManager.upload()` is idempotent by
 * `localMetadata.id`, so this awaits the request the composer already started rather than
 * starting a second one; an attachment whose upload never started (a retry, an offline replay)
 * is uploaded here for the first time.
 *
 * Resolved attachments come back carrying their URL and **without** `localMetadata`, and their
 * local preview is revoked. Failed ones are returned untouched, `localMetadata` and all, so a
 * retry re-uploads only what is still missing.
 */
export const settlePendingAttachmentUploads = async ({
  attachments,
  channelCid,
  client,
}: {
  attachments: NonNullable<LocalMessage['attachments']>;
  channelCid: string;
  client: StreamChat;
}): Promise<{
  attachments: NonNullable<LocalMessage['attachments']>;
  failureReason?: unknown;
}> => {
  const pendingIndexes = attachments.reduce<number[]>((indexes, attachment, index) => {
    if (isPendingUpload(attachment)) indexes.push(index);
    return indexes;
  }, []);

  if (!pendingIndexes.length) return { attachments };

  const settled = await Promise.allSettled(
    pendingIndexes.map((index) => {
      const { file, id } = (attachments[index] as LocalUploadAttachment).localMetadata;
      return client.uploadManager.upload({ channelCid, file, id });
    }),
  );

  const nextAttachments = [...attachments];
  let failureReason: unknown;

  settled.forEach((result, position) => {
    const index = pendingIndexes[position];
    const attachment = nextAttachments[index] as LocalUploadAttachment;

    if (result.status === 'fulfilled' && result.value) {
      nextAttachments[index] = applyUploadResult(attachment, result.value);
      return;
    }

    // Deliberately `allSettled`, and the resolved URLs above are kept even though the message as
    // a whole now fails: a retry then only re-uploads what did not make it.
    if (!failureReason) {
      failureReason =
        result.status === 'rejected'
          ? result.reason
          : new Error('Attachment upload returned no result');
    }
  });

  return { attachments: nextAttachments, failureReason };
};
