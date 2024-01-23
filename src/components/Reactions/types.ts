import { ComponentType } from 'react';

export interface ReactionSummary {
  EmojiComponent: ComponentType | null;
  isOwnReaction: boolean;
  latestReactedUserNames: string[];
  reactionCount: number;
  reactionType: string;
}
