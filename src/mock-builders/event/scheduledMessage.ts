import type {
  ScheduledMessageEventType,
  ScheduledMessageResponse,
  StreamChat,
} from 'stream-chat';

export type DispatchScheduledMessageEventParams = {
  client: StreamChat;
  scheduledMessage: ScheduledMessageResponse;
  type: ScheduledMessageEventType;
};

export const dispatchScheduledMessageEvent = ({
  client,
  scheduledMessage,
  type,
}: DispatchScheduledMessageEventParams) => {
  const { cid, user } = scheduledMessage;

  client.dispatchEvent({
    cid,
    created_at: new Date().toISOString(),
    scheduled_message: scheduledMessage,
    type,
    user,
  });
};
