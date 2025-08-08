import React, { useMemo } from 'react';
import clsx from 'clsx';

import type { ReactionDetailsComparator, ReactionSummary, ReactionType } from './types';

import { Modal as DefaultModal } from '../Modal';
import { useFetchReactions } from './hooks/useFetchReactions';
import { LoadingIndicator } from '../Loading';
import { Avatar } from '../Avatar';
import { useComponentContext, useMessageContext } from '../../context';
import type { ReactionSort } from 'stream-chat';
import type { ModalProps } from '../Modal';
import type { MessageContextValue } from '../../context';

export type ReactionsListModalProps = ModalProps &
  Partial<Pick<MessageContextValue, 'handleFetchReactions' | 'reactionDetailsSort'>> & {
    reactions: ReactionSummary[];
    selectedReactionType: ReactionType;
    onSelectedReactionTypeChange?: (reactionType: ReactionType) => void;
    sort?: ReactionSort;
    /** @deprecated use `sort` instead */
    sortReactionDetails?: ReactionDetailsComparator;
  };

const defaultReactionDetailsSort = { created_at: -1 } as const;

export function ReactionsListModal({
  handleFetchReactions,
  onSelectedReactionTypeChange,
  reactionDetailsSort: propReactionDetailsSort,
  reactions,
  selectedReactionType,
  sortReactionDetails: propSortReactionDetails,
  ...modalProps
}: ReactionsListModalProps) {
  const { Modal = DefaultModal } = useComponentContext();
  const selectedReaction = reactions.find(
    ({ reactionType }) => reactionType === selectedReactionType,
  );
  const SelectedEmojiComponent = selectedReaction?.EmojiComponent ?? null;
  const {
    reactionDetailsSort: contextReactionDetailsSort,
    sortReactionDetails: contextSortReactionDetails,
  } = useMessageContext('ReactionsListModal');
  const legacySortReactionDetails = propSortReactionDetails ?? contextSortReactionDetails;
  const reactionDetailsSort =
    propReactionDetailsSort ?? contextReactionDetailsSort ?? defaultReactionDetailsSort;
  const { isLoading: areReactionsLoading, reactions: reactionDetails } =
    useFetchReactions({
      handleFetchReactions,
      reactionType: selectedReactionType,
      shouldFetch: modalProps.open,
      sort: reactionDetailsSort,
    });

  const reactionDetailsWithLegacyFallback = useMemo(
    () =>
      legacySortReactionDetails
        ? [...reactionDetails].sort(legacySortReactionDetails)
        : reactionDetails,
    [legacySortReactionDetails, reactionDetails],
  );

  return (
    <Modal
      {...modalProps}
      className={clsx('str-chat__message-reactions-details-modal', modalProps.className)}
    >
      <div
        className='str-chat__message-reactions-details'
        data-testid='reactions-list-modal'
      >
        <div className='str-chat__message-reactions-details-reaction-types'>
          {reactions.map(
            ({ EmojiComponent, reactionCount, reactionType }) =>
              EmojiComponent && (
                <div
                  className={clsx('str-chat__message-reactions-details-reaction-type', {
                    'str-chat__message-reactions-details-reaction-type--selected':
                      selectedReactionType === reactionType,
                  })}
                  data-testid={`reaction-details-selector-${reactionType}`}
                  key={reactionType}
                  onClick={() =>
                    onSelectedReactionTypeChange?.(reactionType as ReactionType)
                  }
                >
                  <span className='str-chat__message-reaction-emoji str-chat__message-reaction-emoji--with-fallback'>
                    <EmojiComponent />
                  </span>
                  &nbsp;
                  <span className='str-chat__message-reaction-count'>
                    {reactionCount}
                  </span>
                </div>
              ),
          )}
        </div>
        {SelectedEmojiComponent && (
          <div className='str-chat__message-reaction-emoji str-chat__message-reaction-emoji--with-fallback str-chat__message-reaction-emoji-big'>
            <SelectedEmojiComponent />
          </div>
        )}
        <div
          className='str-chat__message-reactions-details-reacting-users'
          data-testid='all-reacting-users'
        >
          {areReactionsLoading ? (
            <LoadingIndicator />
          ) : (
            reactionDetailsWithLegacyFallback.map(({ user }) => (
              <div
                className='str-chat__message-reactions-details-reacting-user'
                key={user?.id}
              >
                <Avatar
                  className='stream-chat__avatar--reaction'
                  data-testid='avatar'
                  image={user?.image as string | undefined}
                  name={user?.name || user?.id}
                />
                <span
                  className='str-chat__user-item--name'
                  data-testid='reaction-user-username'
                >
                  {user?.name || user?.id}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
