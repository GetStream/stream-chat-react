import type { ComponentType } from 'react';
import type { ReactionResponse } from 'stream-chat';
import { DefaultStreamChatGenerics } from '../../types';

export interface ReactionSummary {
  EmojiComponent: ComponentType | null;
  firstReactionAt: Date | null;
  isOwnReaction: boolean;
  lastReactionAt: Date | null;
  latestReactedUserNames: string[];
  reactionCount: number;
  reactionType: string;
  unlistedReactedUserCount: number;
}

export type ReactionsComparator = (a: ReactionSummary, b: ReactionSummary) => number;

export type ReactionDetailsComparator = (a: ReactionResponse, b: ReactionResponse) => number;

export type ReactionType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = ReactionResponse<StreamChatGenerics>['type'];
