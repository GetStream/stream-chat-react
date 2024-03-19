import type { ComponentType } from 'react';
import type { ReactionResponse } from 'stream-chat';

export interface ReactionSummary {
  EmojiComponent: ComponentType | null;
  isOwnReaction: boolean;
  latestReactedUserNames: string[];
  reactionCount: number;
  reactionType: string;
}

export type ReactionsComparator = (a: ReactionSummary, b: ReactionSummary) => number;

export type ReactionDetailsComparator = (a: ReactionResponse, b: ReactionResponse) => number;
