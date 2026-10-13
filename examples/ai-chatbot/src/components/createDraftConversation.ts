import type { StreamChat } from 'stream-chat';
import { customAlphabet } from 'nanoid';

const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

/**
 * Creates the local (not yet server-side) channel for a new AI conversation.
 *
 * The conversation is created on the server only when its first message is sent, so the composer
 * would see no `upload-file` capability until then. Seeding it locally lets the custom upload
 * function run before that; the server's capabilities replace it on watch.
 */
export const createDraftConversation = (client: StreamChat) => {
  const channel = client.channel('messaging', `ai-${nanoId()}`, {
    members: [{ user_id: client.userID as string }],
  });
  channel.data = { ...channel.data, own_capabilities: ['upload-file'] };
  return channel;
};
