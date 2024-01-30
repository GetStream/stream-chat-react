import { generateUser } from './user';

export const generateReaction = (options = {}) => {
  const user = options.user || generateUser();
  return {
    created_at: new Date(),
    type: 'love',
    user,
    user_id: user.user_id,
    ...options,
  };
};

export const generateReactions = (count, options = () => ({})) => {
  const reactions = [];
  for (let i = 0; i < count; i++) {
    reactions.push(generateReaction(options(i)));
  }
  return reactions;
};

export const countReactions = (reactions = []) => {
  const reactionCount = {};
  for (const reaction of reactions) {
    reactionCount[reaction.type] = (reactionCount[reaction.type] ?? 0) + 1;
  }
  return reactionCount;
};
