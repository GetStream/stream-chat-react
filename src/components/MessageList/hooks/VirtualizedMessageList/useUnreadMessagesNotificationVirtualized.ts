import { useCallback, useEffect, useState } from 'react';
import { StreamMessage } from '../../../../context';
import type { DefaultStreamChatGenerics } from '../../../../types/types';

export type UseUnreadMessagesNotificationParams = {
  unreadCount: number;
  lastRead?: Date | null;
};

export const useUnreadMessagesNotificationVirtualized = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  lastRead,
  unreadCount,
}: UseUnreadMessagesNotificationParams) => {
  const [show, setShow] = useState(false);

  const toggleShowUnreadMessagesNotification = useCallback(
    (renderedMessages: StreamMessage<StreamChatGenerics>[]) => {
      const firstRenderedMessageTimestamp = renderedMessages[0].created_at
        ? new Date(renderedMessages[0].created_at).getTime()
        : 0;
      setShow(unreadCount > 0 && !!lastRead && firstRenderedMessageTimestamp > lastRead.getTime());
    },
    [unreadCount, lastRead],
  );

  useEffect(() => {
    if (!unreadCount) setShow(false);
  }, [unreadCount]);

  return { show, toggleShowUnreadMessagesNotification };
};
