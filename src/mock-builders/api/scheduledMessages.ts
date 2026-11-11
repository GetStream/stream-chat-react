import type {
  MessageResponse,
  ScheduledMessageErrorReason,
  ScheduledMessageResponse,
} from 'stream-chat';

import { mockedApiResponse } from './utils';

type ScheduledMessageRequestMethod = 'delete' | 'patch' | 'post';

const SCHEDULED_MESSAGE_ERROR_STATUS: Record<number, number> = {
  121: 409,
  122: 409,
};

export const queryScheduledMessagesApi = (
  scheduledMessages: ScheduledMessageResponse[] = [],
  next?: string,
) => mockedApiResponse({ next, scheduled_messages: scheduledMessages }, 'post');

export const scheduledMessageApi = (
  scheduledMessage: ScheduledMessageResponse,
  method: ScheduledMessageRequestMethod = 'patch',
) => mockedApiResponse({ scheduled_message: scheduledMessage }, method);

export const sendScheduledMessageApi = (
  scheduledMessage: ScheduledMessageResponse,
  message: Partial<MessageResponse> = {},
) =>
  mockedApiResponse(
    {
      message: {
        id: scheduledMessage.id,
        text: scheduledMessage.message.text,
        ...message,
      },
      scheduled_message: scheduledMessage,
    },
    'post',
  );

export const erroredScheduledMessageApi = (
  code: number,
  reason: ScheduledMessageErrorReason,
  method: ScheduledMessageRequestMethod = 'post',
) => {
  const status = SCHEDULED_MESSAGE_ERROR_STATUS[code] ?? 400;

  const error = {
    code,
    duration: '0.01',
    exception_fields: { reason },
    message: `scheduled message request failed: ${reason}`,
    StatusCode: status,
  };

  return mockedApiResponse(error, method, status);
};
