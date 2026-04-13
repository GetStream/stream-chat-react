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
import type { ReactionsComparator, ReactionType } from './types';
import { DialogAnchor, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';

export type MessageReactionsProps = Partial<
  Pick<MessageContextValue, 'handleFetchReactions' | 'reactionDetailsSort'>
> & {
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse[];
  /** An object containing summary for each reaction type on a message */
  reaction_groups?: Record<string, ReactionGroupResponse>;
  /** An array of the reaction objects to display in the list */
  reactions?: ReactionResponse[];
  /** Display the reactions in the list in reverse order, defaults to false */
  reverse?: boolean;
  /** Comparator function to sort reactions, defaults to chronological order */
  sortReactions?: ReactionsComparator;
  /**
   * Positioning of the reactions list relative to the message. Position is flipped by default for the messages of other users.
   */
  flipHorizontalPosition?: boolean;
  verticalPosition?: 'top' | 'bottom' | null;
  visualStyle?: 'clustered' | 'segmented' | null;
  capLimit?: {
    [key in Extract<MessageReactionsProps['visualStyle'], string>]?: number;
  };
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

const UnMemoizedMessageReactions = (props: MessageReactionsProps) => {
  const {
    capLimit: { clustered: capLimitClustered = 5, segmented: capLimitSegmented = 4 } = {},
    flipHorizontalPosition = false,
    handleFetchReactions,
    reactionDetailsSort,
    verticalPosition = 'top',
    visualStyle = 'clustered',
    ...rest
  } = props;

  const {
    existingReactions,
    hasReactions,
    reactionGroups,
    totalReactionCount,
    uniqueReactionTypeCount,
  } = useProcessReactions(rest);
  const [selectedReactionType, setSelectedReactionType] = useState<ReactionType | null>(
    null,
  );
  const { t } = useTranslationContext('MessageReactions');
  const { MessageReactionsDetail = DefaultMessageReactionsDetail } =
    useComponentContext();
  const { isMyMessage, message } = useMessageContext('MessageReactions');

  const divRef = useRef<ComponentRef<'div'>>(null);
  const dialogId = DefaultMessageReactionsDetail.getDialogId({
    messageId: message.id,
  });
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const isDialogOpen = useDialogIsOpen(dialogId, dialogManager?.id);

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
   * at 4 and calculate the count of the rest. For clustered(top/bottom) we cap
   * the existing reactions to 5 but we don't calculate the count of the rest
   * because we show the total count instead. For segmented style with bottom
   * position we don't cap the existing reactions and we show all of them.
   */
  const cappedExistingReactions = useMemo(() => {
    if (visualStyle === 'segmented' && verticalPosition !== 'top') return null;

    const capLimit = visualStyle === 'segmented' ? capLimitSegmented : capLimitClustered;

    const sliced = existingReactions.slice(0, capLimit);

    return {
      /**
       * Accumulated reaction count of capped reaction types, first four in case of
       * segmented(top) and first five in case of clustered(top/bottom) variations.
       */
      reactionCountToDisplay: sliced.reduce(
        (accumulatedCount, { reactionCount }) => accumulatedCount + reactionCount,
        0,
      ),
      reactionsToDisplay: sliced,
    } as const;
  }, [
    capLimitClustered,
    capLimitSegmented,
    existingReactions,
    verticalPosition,
    visualStyle,
  ]);

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
          aria-expanded={isDialogOpen}
          aria-pressed={isDialogOpen}
          buttonIf={visualStyle === 'clustered'}
          className='str-chat__message-reactions__list-button'
          data-testid='message-reactions-list-button'
          onClick={() => handleReactionButtonClick(null)}
        >
          <ul className='str-chat__message-reactions__list'>
            {(cappedExistingReactions?.reactionsToDisplay ?? existingReactions).map(
              ({ EmojiComponent, reactionCount, reactionType }) =>
                EmojiComponent && (
                  <li
                    className='str-chat__message-reactions__list-item'
                    data-testid='message-reactions-list-item'
                    key={reactionType}
                  >
                    <FragmentOrButton
                      buttonIf={visualStyle === 'segmented'}
                      className='str-chat__message-reactions__list-item-button'
                      onClick={() => handleReactionButtonClick(reactionType)}
                    >
                      <span
                        className='str-chat__message-reactions__list-item-icon'
                        data-testid='message-reactions-list-item-icon'
                      >
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
            {uniqueReactionTypeCount > 4 &&
              cappedExistingReactions &&
              visualStyle === 'segmented' && (
                <li className='str-chat__message-reactions__list-item str-chat__message-reactions__list-item--more'>
                  <button
                    className='str-chat__message-reactions__list-item-button'
                    onClick={() => handleReactionButtonClick(null)}
                  >
                    <span className='str-chat__message-reactions__overflow-count'>
                      +
                      {totalReactionCount -
                        cappedExistingReactions.reactionCountToDisplay}
                    </span>
                  </button>
                </li>
              )}
          </ul>
          {visualStyle === 'clustered' && (
            <span
              className='str-chat__message-reactions__total-count'
              data-testid='message-reactions-total-count'
            >
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
          reactionDetailsSort={reactionDetailsSort}
          reactionGroups={reactionGroups}
          reactions={existingReactions}
          selectedReactionType={selectedReactionType}
          totalReactionCount={totalReactionCount}
        />
      </DialogAnchor>
    </>
  );
};

/**
 * Component that displays a list of reactions on a message.
 */
export const MessageReactions = React.memo(
  UnMemoizedMessageReactions,
) as typeof UnMemoizedMessageReactions;
