import { nowNs } from 'stream-chat';
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
    created_at: nowNs(),
    custom: {},
    scheduled_message: scheduledMessage,
    type,
    user,
  } as Parameters<StreamChat['dispatchEvent']>[0]);
};
