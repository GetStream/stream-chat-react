import { useCallback } from 'react';
import { formatMessage } from 'stream-chat';
import type {
  Channel,
  LocalMessage,
  ScheduledMessageResponse,
  StreamChat,
} from 'stream-chat';

import { useChatContext, useWorkspaceNavigation } from '../../../context';

const resolveParentMessage = async (
  client: StreamChat,
  parentId: string,
): Promise<LocalMessage | undefined> => {
  const storedMessage = client.messageStore.get(parentId);
  if (storedMessage) return storedMessage;
  try {
    const { message } = await client.getMessage({ id: parentId });
    return formatMessage(message);
  } catch {
    return undefined;
  }
};

export const useOpenScheduledMessageInComposer = (channel: Channel) => {
  const { client } = useChatContext();
  const { openThread } = useWorkspaceNavigation();

  const openInComposer = useCallback(
    async (scheduledMessage: ScheduledMessageResponse) => {
      const { parent_id: parentId } = scheduledMessage.message;
      if (!parentId) {
        await channel.messageComposer.editScheduledMessage(scheduledMessage);
        return;
      }

      const parentMessage = await resolveParentMessage(client, parentId);
      if (!parentMessage) return;

      const thread = client.threads.ensure({ channel, parentMessage });
      openThread(thread);
      await thread.messageComposer.editScheduledMessage(scheduledMessage);
    },
    [channel, client, openThread],
  );

  return openInComposer;
};
