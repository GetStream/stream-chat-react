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
  /** Own reactions, used to mark reaction types as own. Defaults to the message's own reactions. */
  own_reactions?: ReactionResponse[];
  /** Summary per reaction type. Defaults to the message's `reaction_groups`. */
  reaction_groups?: Record<string, ReactionGroupResponse>;
  /** Latest reactions, used for the reacting user names. Defaults to the message's latest ones. */
  reactions?: ReactionResponse[];
  /** Not read by the component: the list order comes from `sortReactions`. */
  reverse?: boolean;
  /**
   * Comparator that orders the reaction types. Defaults to `sortReactions` from `MessageContext`,
   * then to ascending time of the first reaction.
   */
  sortReactions?: ReactionsComparator;
  /** Aligns the list to the opposite side of the message. Defaults to false. */
  flipHorizontalPosition?: boolean;
  verticalPosition?: 'top' | 'bottom' | null;
  visualStyle?: 'clustered' | 'segmented' | null;
  capLimit?: {
    [key in Extract<MessageReactionsProps['visualStyle'], string>]?: number;
  };
};

// Renders a button when `buttonIf` is true, otherwise a fragment that drops all props but children.
const FragmentOrButton = ({
  buttonIf: renderButton = false,
  children,
  type = 'button',
  ...props
}: ComponentPropsWithoutRef<'button'> & { buttonIf?: boolean }) => {
  if (renderButton) {
    return (
      <button {...props} type={type}>
        {children}
      </button>
    );
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
  const { t } = useTranslationContext();
  const { MessageReactionsDetail = DefaultMessageReactionsDetail } =
    useComponentContext();
  const { isMyMessage, message } = useMessageContext();

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

  // Segmented at the top caps the list and shows a count of the rest. Clustered caps it and shows
  // the total count instead. Segmented elsewhere is uncapped, so this is null.
  const cappedExistingReactions = useMemo(() => {
    if (visualStyle === 'segmented' && verticalPosition !== 'top') return null;

    const capLimit = visualStyle === 'segmented' ? capLimitSegmented : capLimitClustered;

    const sliced = existingReactions.slice(0, capLimit);

    return {
      // Sum of the capped types' counts; the overflow count is the total minus this.
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
        aria-label={t(
          'reactions.messageReactions.reactionList.ariaLabel',
          'Reaction list',
        )}
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
          aria-label={t(
            'reactions.messageReactions.reactionList.ariaLabel',
            'Reaction list',
          )}
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
                      aria-label={t(
                        'reactions.messageReactions.selectReaction.ariaLabel',
                        'Select Reaction: {{ reactionName }}',
                        {
                          reactionName: reactionType,
                        },
                      )}
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
                    aria-label={t(
                      'reactions.messageReactions.reactionList.ariaLabel',
                      'Reaction list',
                    )}
                    className='str-chat__message-reactions__list-item-button'
                    onClick={() => handleReactionButtonClick(null)}
                    type='button'
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

/** Displays the list of reactions on a message. */
export const MessageReactions = React.memo(
  UnMemoizedMessageReactions,
) as typeof UnMemoizedMessageReactions;
