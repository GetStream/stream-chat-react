import type { ReactionResponse } from 'stream-chat';
import { generateUser } from './user';

export const generateReaction = (options: Partial<ReactionResponse> = {}) => {
  const user = options.user || generateUser();
  return {
    created_at: new Date(),
    type: 'love',
    user,
    user_id: user.id,
    ...options,
  } as ReactionResponse;
};

export const generateReactions = (
  count: number,
  options: (i: number) => Partial<ReactionResponse> = () => ({}),
) => {
  const reactions: ReactionResponse[] = [];
  for (let i = 0; i < count; i++) {
    reactions.push(generateReaction(options(i)));
  }
  return reactions;
};

export const countReactions = (reactions: ReactionResponse[] = []) => {
  const reactionCount: Record<string, number> = {};
  for (const reaction of reactions) {
    reactionCount[reaction.type] = (reactionCount[reaction.type] ?? 0) + 1;
  }
  return reactionCount;
};

export const groupReactions = (reactions: ReactionResponse[] = []) => {
  const timestamp = new Date().toISOString();
  const reactionGroups: Record<
    string,
    { count: number; first_reaction_at: string; last_reaction_at: string }
  > = {};
  for (const reaction of reactions) {
    reactionGroups[reaction.type] ??= {
      count: 0,
      first_reaction_at: timestamp,
      last_reaction_at: timestamp,
    };
    reactionGroups[reaction.type].count++;
  }
  return reactionGroups;
};
