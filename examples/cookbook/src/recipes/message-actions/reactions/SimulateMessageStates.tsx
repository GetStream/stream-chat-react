import { useEffect } from 'react';
import type { LocalMessage, ReactionResponse, StreamChat } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

/**
 * For the screenshots only, not part of the recipe. The demo data has no Markdown, mentions,
 * edits, deletions or reactions, and the seed can't add them, so this changes this page's copy of
 * a few Design review messages: Cleo's reply mentions Bob, uses bold text and is edited, two
 * messages get thumbs-up reactions, and with `deleted` Cara's message about the mockups is shown
 * as deleted. Nothing is sent to the server.
 */
export const SimulateMessageStates = ({ deleted = false }: { deleted?: boolean }) => {
  const { client } = useChatContext();

  useEffect(() => {
    const patches: Record<string, (message: LocalMessage) => Partial<LocalMessage>> = {
      'docs-v15-ck-design-3': (message) => ({
        mentioned_users: usersById(client, ['docs-v15-ck-bob']),
        message_text_updated_at: message.created_at,
        reaction_groups: { '+1': reactionGroup(message, 2) },
        latest_reactions: reactions(client, message, [
          'docs-v15-ck-bob',
          'docs-v15-ck-cara',
        ]),
        text: '@Bob yes, the **rounded** set fits better with the avatars.',
      }),
      'docs-v15-ck-design-5': (message) => {
        const latest = reactions(client, message, [
          'docs-v15-ck-bob',
          'docs-v15-ck-dan',
          'docs-v15-ck-cleo',
        ]);
        return {
          latest_reactions: latest,
          own_reactions: latest.filter(({ user_id }) => user_id === client.userId),
          reaction_groups: { '+1': reactionGroup(message, 3) },
        };
      },
      ...(deleted && {
        'docs-v15-ck-design-6': (message: LocalMessage) => ({
          deleted_at: message.created_at,
          text: '',
          type: 'deleted' as const,
        }),
      }),
    };

    // The store hands out a new object on every server update; patched ones are remembered, so a
    // patch is applied once per update and never to its own result.
    const patched = new WeakSet<LocalMessage>();
    const unsubscribes = Object.entries(patches).map(([id, patch]) =>
      client.messageStore.subscribe(id, (message) => {
        if (!message || patched.has(message)) return;
        // Written after the store finishes notifying, never from inside its notification.
        queueMicrotask(() => {
          const current = client.messageStore.get(id);
          if (!current || patched.has(current)) return;
          const next = { ...current, ...patch(current) };
          patched.add(next);
          client.messageStore.upsert(next);
        });
      }),
    );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [client, deleted]);

  return null;
};

const usersById = (client: StreamChat, ids: string[]) =>
  ids.flatMap((id) => (client.state.users[id] ? [client.state.users[id]] : []));

const reactions = (
  client: StreamChat,
  message: LocalMessage,
  userIds: string[],
): ReactionResponse[] =>
  usersById(client, userIds).map((user) => ({
    created_at: message.created_at,
    custom: {},
    message_id: message.id,
    score: 1,
    type: '+1',
    updated_at: message.created_at,
    user,
    user_id: user.id,
  }));

const reactionGroup = (message: LocalMessage, count: number) => ({
  count,
  first_reaction_at: message.created_at,
  last_reaction_at: message.created_at,
  latest_reactions_by: [],
  sum_scores: count,
});
