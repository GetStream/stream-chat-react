import React, { useState } from 'react';
import clsx from 'clsx';

import type { ReactionGroupResponse, ReactionResponse } from 'stream-chat';

import { useProcessReactions } from './hooks/useProcessReactions';
import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ReactionOptions } from './reactionOptions';
import type { ReactionDetailsComparator, ReactionsComparator, ReactionType } from './types';
import { ReactionsListModal } from './ReactionsListModal';
import { MessageContextValue, useTranslationContext } from '../../context';
import { MAX_MESSAGE_REACTIONS_TO_FETCH } from '../Message/hooks';

export type ReactionsListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Partial<
  Pick<MessageContextValue<StreamChatGenerics>, 'handleFetchReactions' | 'reactionDetailsSort'>
> & {
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse<StreamChatGenerics>[];
  /**
   * An object that keeps track of the count of each type of reaction on a message
   * @deprecated This override value is no longer taken into account. Use `reaction_groups` to override reaction counts instead.
   * */
  reaction_counts?: Record<string, number>;
  /** An object containing summary for each reaction type on a message */
  reaction_groups?: Record<string, ReactionGroupResponse>;
  /**
   * @deprecated
   * A list of the currently supported reactions on a message
   * */
  reactionOptions?: ReactionOptions;
  /** An array of the reaction objects to display in the list */
  reactions?: ReactionResponse<StreamChatGenerics>[];
  /** Display the reactions in the list in reverse order, defaults to false */
  reverse?: boolean;
  /** Comparator function to sort the list of reacted users
   * @deprecated use `reactionDetailsSort` instead
   */
  sortReactionDetails?: ReactionDetailsComparator;
  /** Comparator function to sort reactions, defaults to chronological order */
  sortReactions?: ReactionsComparator;
};

const UnMemoizedReactionsList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ReactionsListProps<StreamChatGenerics>,
) => {
  const {
    handleFetchReactions,
    reactionDetailsSort,
    reverse = false,
    sortReactionDetails,
    ...rest
  } = props;
  const { existingReactions, hasReactions, totalReactionCount } = useProcessReactions(rest);
  const [
    selectedReactionType,
    setSelectedReactionType,
  ] = useState<ReactionType<StreamChatGenerics> | null>(null);
  const { t } = useTranslationContext('ReactionsList');

  const handleReactionButtonClick = (reactionType: string) => {
    if (totalReactionCount > MAX_MESSAGE_REACTIONS_TO_FETCH) {
      return;
    }

    setSelectedReactionType(reactionType as ReactionType<StreamChatGenerics>);
  };

  if (!hasReactions) return null;

  return (
    <>
      <div
        aria-label={t('aria/Reaction list')}
        className={clsx('str-chat__reaction-list str-chat__message-reactions-container', {
          // we are stuck with both classes as both are used in CSS
          'str-chat__reaction-list--reverse': reverse,
        })}
        data-testid='reaction-list'
        role='figure'
      >
        <ul className='str-chat__message-reactions'>
          {existingReactions.map(
            ({ EmojiComponent, isOwnReaction, reactionCount, reactionType }) =>
              EmojiComponent && (
                <li
                  className={clsx('str-chat__message-reaction', {
                    'str-chat__message-reaction-own': isOwnReaction,
                  })}
                  key={reactionType}
                >
                  <button
                    aria-label={`Reactions: ${reactionType}`}
                    data-testid={`reactions-list-button-${reactionType}`}
                    onClick={() => handleReactionButtonClick(reactionType)}
                    type='button'
                  >
                    <span className='str-chat__message-reaction-emoji'>
                      <EmojiComponent />
                    </span>
                    &nbsp;
                    <span
                      className='str-chat__message-reaction-count'
                      data-testclass='reaction-list-reaction-count'
                    >
                      {reactionCount}
                    </span>
                  </button>
                </li>
              ),
          )}
          <li>
            <span className='str-chat__reaction-list--counter'>{totalReactionCount}</span>
          </li>
        </ul>
      </div>
      {selectedReactionType !== null && (
        <ReactionsListModal
          handleFetchReactions={handleFetchReactions}
          onClose={() => setSelectedReactionType(null)}
          onSelectedReactionTypeChange={setSelectedReactionType}
          open={selectedReactionType !== null}
          reactions={existingReactions}
          selectedReactionType={selectedReactionType}
          sortReactionDetails={sortReactionDetails}
        />
      )}
    </>
  );
};

/**
 * Component that displays a list of reactions on a message.
 */
export const ReactionsList = React.memo(UnMemoizedReactionsList) as typeof UnMemoizedReactionsList;
