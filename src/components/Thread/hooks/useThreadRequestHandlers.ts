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
  Thread as StreamThread,
  UpdateMessageOptions,
} from 'stream-chat';

export type ThreadRequestHandlersParams = {
  threadInstance?: StreamThread;
  doDeleteMessageRequest?: (
    thread: StreamThread,
    message: LocalMessage,
    options?: DeleteMessageOptions,
  ) => Promise<MessageResponse>;
  doMarkReadRequest?: (params: {
    thread: StreamThread;
    options?: MarkReadOptions;
  }) => Promise<EventAPIResponse | null> | void;
  doSendMessageRequest?: (
    thread: StreamThread,
    message: Message,
    options?: SendMessageOptions,
  ) => ReturnType<StreamChannel['sendMessage']> | void;
  doUpdateMessageRequest?: (
    thread: StreamThread,
    updatedMessage: LocalMessage | MessageResponse,
    options?: UpdateMessageOptions,
  ) => ReturnType<StreamChat['updateMessage']>;
};

export const useThreadRequestHandlers = ({
  doDeleteMessageRequest,
  doMarkReadRequest,
  doSendMessageRequest,
  doUpdateMessageRequest,
  threadInstance,
}: ThreadRequestHandlersParams) => {
  useEffect(() => {
    if (!threadInstance) return;

    const channel = threadInstance.channel;
    const currentRequestHandlers = channel.configState.getLatestValue()
      .requestHandlers as Record<string, unknown> | undefined;
    const nextRequestHandlers = { ...(currentRequestHandlers ?? {}) } as Record<
      string,
      unknown
    >;

    const withParentId = <TOptions>(options: TOptions): TOptions =>
      ({ ...(options as object), parent_id: threadInstance.id }) as TOptions;

    const isMessageFromThread = (message?: Pick<LocalMessage, 'id' | 'parent_id'>) =>
      !!message &&
      (message.parent_id === threadInstance.id || message.id === threadInstance.id);

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
      }) => {
        if (isMessageFromThread(params.localMessage)) {
          const message = await doDeleteMessageRequest(
            threadInstance,
            params.localMessage,
            withParentId(params.options),
          );
          return { message };
        }

        const fallback = await channel
          .getClient()
          .deleteMessage(params.localMessage.id, params.options);
        return { message: fallback.message };
      };
    }

    if (doSendMessageRequest) {
      const sendMessageRequest = async (params: {
        localMessage: LocalMessage;
        message?: Message;
        options?: SendMessageOptions;
      }) => {
        const sourceMessage = params.message ?? params.localMessage;
        const targetMessage = {
          ...sourceMessage,
          parent_id: sourceMessage.parent_id ?? threadInstance.id,
        } as Message;

        if (isMessageFromThread(params.localMessage)) {
          const response = await doSendMessageRequest(
            threadInstance,
            targetMessage,
            withParentId(params.options),
          );
          if (response?.message) return { message: response.message };
        }

        const fallback = await channel.sendMessage(targetMessage, params.options);
        return { message: fallback.message };
      };

      nextRequestHandlers.sendMessageRequest = sendMessageRequest;
      nextRequestHandlers.retrySendMessageRequest = sendMessageRequest;
    }

    if (doUpdateMessageRequest) {
      nextRequestHandlers.updateMessageRequest = async (params: {
        localMessage: LocalMessage;
        options?: UpdateMessageOptions;
      }) => {
        if (isMessageFromThread(params.localMessage)) {
          const response = await doUpdateMessageRequest(
            threadInstance,
            {
              ...params.localMessage,
              parent_id: params.localMessage.parent_id ?? threadInstance.id,
            },
            withParentId(params.options),
          );
          return { message: response.message };
        }

        const fallback = await channel
          .getClient()
          .updateMessage(params.localMessage, undefined, params.options);
        return { message: fallback.message };
      };
    }

    if (doMarkReadRequest) {
      nextRequestHandlers.markReadRequest = async (params: {
        channel: typeof channel;
        thread?: StreamThread;
        options?: MarkReadOptions;
      }) => {
        if (params.thread?.id === threadInstance.id) {
          const response = await doMarkReadRequest({
            options: params.options,
            thread: threadInstance,
          });
          if (response !== undefined) return response;
        }

        return await params.channel.markAsReadRequest(params.options);
      };
    }

    channel.configState.partialNext({
      requestHandlers:
        Object.keys(nextRequestHandlers).length > 0 ? nextRequestHandlers : undefined,
    });
  }, [
    doDeleteMessageRequest,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
    threadInstance,
  ]);
};
