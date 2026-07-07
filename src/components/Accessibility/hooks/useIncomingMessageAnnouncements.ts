import { useCallback, useEffect, useRef } from 'react';
import type { Channel, EventPayload, LocalMessage, MessageResponse } from 'stream-chat';

import { useAriaLiveAnnouncer } from '../useAriaLiveAnnouncer';
import { useTranslationContext } from '../../../context/TranslationContext';

const MESSAGE_ANNOUNCEMENT_THROTTLE_MS = 1000;

const isAnnounceableIncomingMessage = (
  message: LocalMessage | MessageResponse,
  ownUserId?: string,
): boolean => {
  const messageUserId = message.user?.id;

  if (!message.id || !messageUserId || messageUserId === ownUserId) {
    return false;
  }

  // TODO: message coming from the event does not have a status
  const status = (message as LocalMessage).status;
  return (
    message.type !== 'deleted' &&
    message.type !== 'ephemeral' &&
    message.type !== 'error' &&
    message.type !== 'system' &&
    status !== 'failed' &&
    status !== 'sending'
  );
};

const getSenderName = (
  message: MessageResponse,
  t: ReturnType<typeof useTranslationContext>['t'],
) => message.user?.name?.trim() || message.user?.id || t('Anonymous');

export type UseIncomingMessageAnnouncementsParams = {
  activeThreadId?: string;
  channel?: Channel;
  ownUserId?: string;
  threadList?: boolean;
};

export const useIncomingMessageAnnouncements = ({
  activeThreadId,
  channel,
  ownUserId,
  threadList = false,
}: UseIncomingMessageAnnouncementsParams) => {
  const announce = useAriaLiveAnnouncer();
  const { t } = useTranslationContext('useIncomingMessageAnnouncements');
  const lastAnnouncementTimestampRef = useRef(0);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const announcedMessageIdsRef = useRef(new Set<string>());
  const pendingAnnouncementBatchRef = useRef<{
    count: number;
    firstSender: string | null;
  }>({
    count: 0,
    firstSender: null,
  });

  const flushPendingAnnouncements = useCallback(() => {
    const pendingAnnouncementBatch = pendingAnnouncementBatchRef.current;

    if (pendingAnnouncementBatch.count <= 0) return;

    if (pendingAnnouncementBatch.count === 1) {
      announce(
        t('New message from {{user}}', {
          user: pendingAnnouncementBatch.firstSender || t('Anonymous'),
        }),
      );
    } else {
      announce(t('{{count}} new messages', { count: pendingAnnouncementBatch.count }));
    }

    pendingAnnouncementBatch.count = 0;
    pendingAnnouncementBatch.firstSender = null;
    lastAnnouncementTimestampRef.current = Date.now();
  }, [announce, t]);

  const scheduleFlush = useCallback(() => {
    if (flushTimeoutRef.current) return;

    const now = Date.now();
    const elapsedSinceLastAnnouncement = now - lastAnnouncementTimestampRef.current;

    if (elapsedSinceLastAnnouncement >= MESSAGE_ANNOUNCEMENT_THROTTLE_MS) {
      flushPendingAnnouncements();
      return;
    }

    flushTimeoutRef.current = setTimeout(() => {
      flushTimeoutRef.current = undefined;
      flushPendingAnnouncements();
    }, MESSAGE_ANNOUNCEMENT_THROTTLE_MS - elapsedSinceLastAnnouncement);
  }, [flushPendingAnnouncements]);

  useEffect(
    () => () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!channel) {
      return;
    }

    const handleMessageNew = (event: EventPayload<'message.new'>) => {
      const message = event.message;
      if (!message) return;

      if (
        (event.cid && event.cid !== channel.cid) ||
        !isAnnounceableIncomingMessage(message, ownUserId)
      ) {
        return;
      }

      const isReply = !!message.parent_id;
      const belongsToActiveThread =
        !!activeThreadId && message.parent_id === activeThreadId;
      const shouldAnnounceInThreadList = threadList && belongsToActiveThread;
      const shouldAnnounceInMainList = !threadList && !isReply;

      if (!shouldAnnounceInThreadList && !shouldAnnounceInMainList) {
        return;
      }

      if (announcedMessageIdsRef.current.has(message.id || '')) {
        return;
      }

      if (message.id) {
        if (announcedMessageIdsRef.current.size > 500) {
          announcedMessageIdsRef.current.clear();
        }
        announcedMessageIdsRef.current.add(message.id);
      }

      pendingAnnouncementBatchRef.current.count += 1;
      if (!pendingAnnouncementBatchRef.current.firstSender) {
        pendingAnnouncementBatchRef.current.firstSender = getSenderName(message, t);
      }

      scheduleFlush();
    };

    const subscription = channel.on('message.new', handleMessageNew);

    return () => {
      subscription.unsubscribe();
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = undefined;
      }
    };
  }, [activeThreadId, channel, ownUserId, scheduleFlush, t, threadList]);
};
