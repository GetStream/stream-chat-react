/* eslint-disable sort-keys */
import React, { useState } from 'react';
import clsx from 'clsx';

import type { ReactionsListModalProps } from './ReactionsListModal';
import { ReactionsListModal as DefaultReactionsListModal } from './ReactionsListModal';
import { useProcessReactions } from './hooks/useProcessReactions';
import type { MessageContextValue } from '../../context';
import {
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';

import { MAX_MESSAGE_REACTIONS_TO_FETCH } from '../Message/hooks';

import type { ReactionGroupResponse, ReactionResponse } from 'stream-chat';
import type { ReactionOptions } from './reactionOptions';
import type {
  ReactionDetailsComparator,
  ReactionsComparator,
  ReactionType,
} from './types';

export type ReactionsListProps = Partial<
  Pick<MessageContextValue, 'handleFetchReactions' | 'reactionDetailsSort'>
> & {
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse[];
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
  reactions?: ReactionResponse[];
  /** Display the reactions in the list in reverse order, defaults to false */
  reverse?: boolean;
  /** Comparator function to sort the list of reacted users
   * @deprecated use `reactionDetailsSort` instead
   */
  sortReactionDetails?: ReactionDetailsComparator;
  /** Comparator function to sort reactions, defaults to chronological order */
  sortReactions?: ReactionsComparator;

  /**
   * Positioning of the reactions list relative to the message. Position is flipped by default for the messages of other users.
   */
  horizontalPosition?: 'start' | 'end' | null;
  verticalPosition?: 'top' | 'bottom' | null;
};

const UnMemoizedReactionsList = (props: ReactionsListProps) => {
  const { isMyMessage } = useMessageContext();
  const messageBelongsToCurrentUser = isMyMessage();

  const {
    handleFetchReactions,
    horizontalPosition = messageBelongsToCurrentUser ? 'start' : 'end',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reactionDetailsSort,
    sortReactionDetails,
    verticalPosition = 'top',
    ...rest
  } = props;

  const { existingReactions, hasReactions, totalReactionCount } =
    useProcessReactions(rest);
  const [selectedReactionType, setSelectedReactionType] = useState<ReactionType | null>(
    null,
  );
  const { t } = useTranslationContext('ReactionsList');
  const { ReactionsListModal = DefaultReactionsListModal } = useComponentContext();

  const handleReactionButtonClick = (reactionType: string) => {
    if (totalReactionCount > MAX_MESSAGE_REACTIONS_TO_FETCH) {
      return;
    }

    setSelectedReactionType(reactionType as ReactionType);
  };

  if (!hasReactions) return null;

  return (
    <>
      <div
        aria-label={t('aria/Reaction list')}
        className={clsx('str-chat__message-reactions', {
          [`str-chat__message-reactions--${horizontalPosition}`]:
            typeof horizontalPosition === 'string',
          [`str-chat__message-reactions--${verticalPosition}`]:
            typeof verticalPosition === 'string',
          'str-chat__message-reactions--clustered': true,
          'str-chat__message-reactions--segmented': false,
        })}
        role='figure'
      >
        <ul className='str-chat__message-reactions__list'>
          {existingReactions.map(
            ({ EmojiComponent, reactionCount, reactionType }) =>
              EmojiComponent && (
                <li
                  className={clsx('str-chat__message-reactions__list-item')}
                  key={reactionType}
                >
                  <span className='str-chat__message-reactions__item-icon'>
                    <EmojiComponent />
                  </span>
                  <span
                    className='str-chat__message-reactions__item-count'
                    data-testclass='reaction-list-reaction-count'
                  >
                    {reactionCount}
                  </span>
                </li>
              ),
          )}
        </ul>
        <span className='str-chat__message-reactions__total-count'>
          {totalReactionCount}
        </span>
      </div>
      {selectedReactionType !== null && (
        <ReactionsListModal
          handleFetchReactions={handleFetchReactions}
          onClose={() => setSelectedReactionType(null)}
          onSelectedReactionTypeChange={
            setSelectedReactionType as ReactionsListModalProps['onSelectedReactionTypeChange']
          }
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
export const ReactionsList = React.memo(
  UnMemoizedReactionsList,
) as typeof UnMemoizedReactionsList;
