import { useEffect } from 'react';
import { getScheduledMessageErrorReason, ScheduledMessageErrorReason } from 'stream-chat';
import type { Event, StreamChat } from 'stream-chat';

const isFeatureDisabledError = (error: Error) =>
  getScheduledMessageErrorReason(error) === ScheduledMessageErrorReason.Disabled;

export const useLoadScheduledMessages = (client: StreamChat) => {
  useEffect(() => {
    const { scheduledMessages } = client;

    const loadScheduledMessages = () => {
      const { isDisabled, isLoaded, isLoading } =
        scheduledMessages.state.getLatestValue();
      const hasConnectedUser = !!client.user?.id && !client.anonymous;

      const shouldLoad = hasConnectedUser && !isDisabled && !isLoaded && !isLoading;

      if (!shouldLoad) return;

      scheduledMessages.load().catch((error: Error) => {
        if (isFeatureDisabledError(error)) return;

        client.logger('warn', 'scheduledMessages: load failed', {
          error,
          tags: ['scheduled_messages'],
        });
      });
    };

    const loadWhenOnline = ({ online }: Event) => {
      if (online) loadScheduledMessages();
    };

    loadScheduledMessages();

    const subscriptions = [
      client.on('connection.changed', loadWhenOnline),
      client.on('connection.recovered', loadScheduledMessages),
    ];

    return () => subscriptions.forEach(({ unsubscribe }) => unsubscribe());
  }, [client]);
};
