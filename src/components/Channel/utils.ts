import {
  type APIErrorResponse,
  type ChannelState,
  ErrorFromResponse,
  type MessageResponse,
} from 'stream-chat';

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
