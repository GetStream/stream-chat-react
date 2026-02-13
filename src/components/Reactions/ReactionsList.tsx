import React, { type ComponentPropsWithoutRef, useState } from 'react';
import clsx from 'clsx';

import type { ReactionsListModalProps } from './ReactionsListModal';
import { ReactionsListModal as DefaultReactionsListModal } from './ReactionsListModal';
import { useProcessReactions } from './hooks/useProcessReactions';
import type { MessageContextValue } from '../../context';
import { useComponentContext, useTranslationContext } from '../../context';

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
  flipHorizontalPosition?: boolean;
  verticalPosition?: 'top' | 'bottom' | null;
  visualStyle?: 'clustered' | 'segmented' | null;
};

const FragmentOrButton = ({
  buttonIf: renderButton = false,
  children,
  ...props
}: ComponentPropsWithoutRef<'button'> & { buttonIf?: boolean }) => {
  if (renderButton) {
    return <button {...props}>{children}</button>;
  }

  return <>{children}</>;
};

const UnMemoizedReactionsList = (props: ReactionsListProps) => {
  const {
    flipHorizontalPosition = false,
    handleFetchReactions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reactionDetailsSort,
    sortReactionDetails,
    verticalPosition = 'top',
    visualStyle = 'clustered',
    ...rest
  } = props;

  const { existingReactions, hasReactions, totalReactionCount } =
    useProcessReactions(rest);
  const [selectedReactionType, setSelectedReactionType] = useState<ReactionType | null>(
    null,
  );
  const { t } = useTranslationContext('ReactionsList');
  const { ReactionsListModal = DefaultReactionsListModal } = useComponentContext();

  const handleReactionButtonClick = (reactionType: ReactionType) => {
    if (totalReactionCount > MAX_MESSAGE_REACTIONS_TO_FETCH) {
      return;
    }

    setSelectedReactionType(reactionType);
  };

  if (!hasReactions) return null;

  return (
    <>
      <div
        aria-label={t('aria/Reaction list')}
        className={clsx('str-chat__message-reactions', {
          [`str-chat__message-reactions--flipped-horizontally`]: flipHorizontalPosition,
          [`str-chat__message-reactions--${verticalPosition}`]:
            typeof verticalPosition === 'string',
          [`str-chat__message-reactions--${visualStyle}`]:
            typeof visualStyle === 'string',
        })}
        role='figure'
      >
        <FragmentOrButton
          buttonIf={visualStyle === 'clustered'}
          className='str-chat__message-reactions__list-button'
          onClick={() =>
            setSelectedReactionType(existingReactions[0]?.reactionType ?? null)
          }
        >
          <ul className='str-chat__message-reactions__list'>
            {existingReactions.map(
              ({ EmojiComponent, reactionCount, reactionType }) =>
                EmojiComponent && (
                  <li
                    className='str-chat__message-reactions__list-item'
                    key={reactionType}
                  >
                    <FragmentOrButton
                      buttonIf={visualStyle === 'segmented'}
                      className='str-chat__message-reactions__list-item-button'
                      onClick={() => handleReactionButtonClick(reactionType)}
                    >
                      <span className='str-chat__message-reactions__item-icon'>
                        <EmojiComponent />
                      </span>
                      {visualStyle === 'segmented' && (
                        <span
                          className='str-chat__message-reactions__item-count'
                          data-testclass='message-reactions-item-count'
                        >
                          {reactionCount}
                        </span>
                      )}
                    </FragmentOrButton>
                  </li>
                ),
            )}
          </ul>
          {visualStyle === 'clustered' && (
            <span className='str-chat__message-reactions__total-count'>
              {totalReactionCount}
            </span>
          )}
        </FragmentOrButton>
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
