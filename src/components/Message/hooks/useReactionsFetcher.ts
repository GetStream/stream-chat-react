import { useChatContext } from '../../../context';
import { useStableCallback } from '../../../utils/useStableCallback';
import type {
  LocalMessage,
  ReactionResponse,
  SortParamRequest,
  StreamChat,
} from 'stream-chat';
import type { ReactionType } from '../../Reactions/types';

export const MAX_MESSAGE_REACTIONS_TO_FETCH = 1000;

export function useReactionsFetcher(message: LocalMessage) {
  const { client } = useChatContext();

  return useStableCallback((reactionType?: ReactionType, sort?: SortParamRequest[]) =>
    fetchMessageReactions(client, message.id, reactionType, sort),
  );
}

async function fetchMessageReactions(
  client: StreamChat,
  messageId: string,
  reactionType?: ReactionType,
  sort?: SortParamRequest[],
) {
  const reactions: ReactionResponse[] = [];
  const limit = 25;
  let next: string | undefined;
  let hasNext = true;

  while (hasNext && reactions.length < MAX_MESSAGE_REACTIONS_TO_FETCH) {
    const response = await client.queryReactions({
      filter: reactionType ? { type: reactionType } : {},
      id: messageId,
      limit,
      next,
      sort,
    });

    reactions.push(...response.reactions);
    next = response.next;
    hasNext = Boolean(next);
  }

  return reactions;
}
