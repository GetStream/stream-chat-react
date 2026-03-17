import type { ChannelState, MessageResponse } from 'stream-chat';

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
