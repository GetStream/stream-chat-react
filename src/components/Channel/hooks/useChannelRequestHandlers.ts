import { useEffect } from 'react';
import type {
  DeleteMessageOptions,
  EventAPIResponse,
  LocalMessage,
  MarkReadOptions,
  Message,
  MessageResponse,
  SendMessageOptions,
  Channel as StreamChannel,
  StreamChat,
  UpdateMessageOptions,
} from 'stream-chat';

export type ChannelRequestHandlersParams = {
  channel: StreamChannel;
  doDeleteMessageRequest?: (
    message: LocalMessage,
    options?: DeleteMessageOptions,
  ) => Promise<MessageResponse>;
  doMarkReadRequest?: (
    channel: StreamChannel,
    options?: MarkReadOptions,
  ) => Promise<EventAPIResponse | null> | void;
  doSendMessageRequest?: (
    channel: StreamChannel,
    message: Message,
    options?: SendMessageOptions,
  ) => ReturnType<StreamChannel['sendMessage']> | void;
  doUpdateMessageRequest?: (
    cid: string,
    updatedMessage: LocalMessage | MessageResponse,
    options?: UpdateMessageOptions,
  ) => ReturnType<StreamChat['updateMessage']>;
};

export const useChannelRequestHandlers = ({
  channel,
  doDeleteMessageRequest,
  doMarkReadRequest,
  doSendMessageRequest,
  doUpdateMessageRequest,
}: ChannelRequestHandlersParams) => {
  useEffect(() => {
    const currentRequestHandlers = channel.configState.getLatestValue()
      .requestHandlers as Record<string, unknown> | undefined;
    const nextRequestHandlers = { ...(currentRequestHandlers ?? {}) } as Record<
      string,
      unknown
    >;

    // Reset managed operation handlers and register only currently provided custom handlers.
    delete nextRequestHandlers.deleteMessageRequest;
    delete nextRequestHandlers.markReadRequest;
    delete nextRequestHandlers.retrySendMessageRequest;
    delete nextRequestHandlers.sendMessageRequest;
    delete nextRequestHandlers.updateMessageRequest;

    if (doDeleteMessageRequest) {
      nextRequestHandlers.deleteMessageRequest = async (params: {
        localMessage: LocalMessage;
        options?: DeleteMessageOptions;
      }) => ({
        message: await doDeleteMessageRequest(params.localMessage, params.options),
      });
    }

    if (doSendMessageRequest) {
      const sendMessageRequest = async (params: {
        message?: Message;
        options?: SendMessageOptions;
      }) => {
        const response = await doSendMessageRequest(
          channel,
          params.message as Message,
          params.options,
        );
        if (response?.message) return { message: response.message };
        const fallback = await channel.sendMessage(
          params.message as Message,
          params.options,
        );
        return { message: fallback.message };
      };

      nextRequestHandlers.sendMessageRequest = sendMessageRequest;
      nextRequestHandlers.retrySendMessageRequest = sendMessageRequest;
    }

    if (doUpdateMessageRequest) {
      nextRequestHandlers.updateMessageRequest = async (params: {
        localMessage: LocalMessage;
        options?: UpdateMessageOptions;
      }) => ({
        message: (
          await doUpdateMessageRequest(channel.cid, params.localMessage, params.options)
        ).message,
      });
    }

    if (doMarkReadRequest) {
      nextRequestHandlers.markReadRequest = async (params: {
        channel: StreamChannel;
        options?: MarkReadOptions;
      }) => {
        const response = await doMarkReadRequest(params.channel, params.options);
        if (response !== undefined) return response;
        return await params.channel.markAsReadRequest(params.options);
      };
    }

    channel.configState.partialNext({
      requestHandlers:
        Object.keys(nextRequestHandlers).length > 0 ? nextRequestHandlers : undefined,
    });
  }, [
    channel,
    doDeleteMessageRequest,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
  ]);
};
