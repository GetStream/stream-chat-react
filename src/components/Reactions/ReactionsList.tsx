import React, {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  useMemo,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';

import { MessageReactionsDetail as DefaultMessageReactionsDetail } from './MessageReactionsDetail';
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
import { DialogAnchor, useDialogOnNearestManager } from '../Dialog';

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

/**
 * Renders a button if `buttonIf` is true, otherwise renders a fragment. No props but children are passed to fragment, but all props are passed to button if it's rendered.
 */
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

  const { existingReactions, hasReactions, totalReactionCount, uniqueReactionTypeCount } =
    useProcessReactions(rest);
  const [selectedReactionType, setSelectedReactionType] = useState<ReactionType | null>(
    null,
  );
  const { t } = useTranslationContext('ReactionsList');
  const { MessageReactionsDetail = DefaultMessageReactionsDetail } = useComponentContext();
  const { isMyMessage, message } = useMessageContext('ReactionsList');

  const divRef = useRef<ComponentRef<'div'>>(null);
  const dialogId = `message-reactions-detail-${message.id}`;
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });

  const handleReactionButtonClick = (reactionType: ReactionType | null) => {
    if (totalReactionCount > MAX_MESSAGE_REACTIONS_TO_FETCH) {
      return;
    }

    setSelectedReactionType(reactionType);

    dialog.open();
  };

  /**
   * In segmented style with top position we show max 4 reactions and a
   * count of the rest, so we need to cap the existing reactions to display
   * at 4 and calculate the count of the rest.
   */
  const cappedExistingReactions = useMemo(() => {
    if (visualStyle !== 'segmented' || verticalPosition !== 'top') return null;

    const sliced = existingReactions.slice(0, 4);
    return {
      reactionCountToDisplay: sliced.reduce(
        (accumulatedCount, { reactionCount }) => accumulatedCount + reactionCount,
        0,
      ),
      reactionsToDisplay: sliced,
    };
  }, [existingReactions, verticalPosition, visualStyle]);

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
        ref={divRef}
        role='figure'
      >
        <FragmentOrButton
          buttonIf={visualStyle === 'clustered'}
          className='str-chat__message-reactions__list-button'
          onClick={() =>
            handleReactionButtonClick(existingReactions[0]?.reactionType ?? null)
          }
        >
          <ul className='str-chat__message-reactions__list'>
            {(cappedExistingReactions?.reactionsToDisplay ?? existingReactions).map(
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
                      <span className='str-chat__message-reactions__list-item-icon'>
                        <EmojiComponent />
                      </span>
                      {visualStyle === 'segmented' && reactionCount > 1 && (
                        <span
                          className='str-chat__message-reactions__list-item-count'
                          data-testclass='message-reactions-item-count'
                        >
                          {reactionCount}
                        </span>
                      )}
                    </FragmentOrButton>
                  </li>
                ),
            )}
            {uniqueReactionTypeCount > 4 && cappedExistingReactions && (
              <li className='str-chat__message-reactions__list-item str-chat__message-reactions__list-item--more'>
                <button
                  className='str-chat__message-reactions__list-item-button'
                  onClick={() =>
                    handleReactionButtonClick(
                      existingReactions.at(-1)?.reactionType ?? null,
                    )
                  }
                >
                  <span className='str-chat__message-reactions__overflow-count'>
                    +{totalReactionCount - cappedExistingReactions.reactionCountToDisplay}
                  </span>
                </button>
              </li>
            )}
          </ul>
          {visualStyle === 'clustered' && (
            <span className='str-chat__message-reactions__total-count'>
              {totalReactionCount}
            </span>
          )}
        </FragmentOrButton>
      </div>

      <DialogAnchor
        dialogManagerId={dialogManager?.id}
        id={dialogId}
        offset={8}
        placement={isMyMessage() ? 'bottom-end' : 'bottom-start'}
        referenceElement={divRef.current}
        trapFocus
        updatePositionOnContentResize
      >
        <MessageReactionsDetail
          handleFetchReactions={handleFetchReactions}
          onSelectedReactionTypeChange={setSelectedReactionType}
          reactions={existingReactions}
          selectedReactionType={selectedReactionType}
          sortReactionDetails={sortReactionDetails}
          totalReactionCount={totalReactionCount}
        />
      </DialogAnchor>
    </>
  );
};

/**
 * Component that displays a list of reactions on a message.
 */
export const ReactionsList = React.memo(
  UnMemoizedReactionsList,
) as typeof UnMemoizedReactionsList;
