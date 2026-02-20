import React, { useMemo } from 'react';
import clsx from 'clsx';

import type { ReactionDetailsComparator, ReactionSummary, ReactionType } from './types';

import { Modal as DefaultModal } from '../Modal';
import { useFetchReactions } from './hooks/useFetchReactions';
import { LoadingIndicator } from '../Loading';
import { Avatar } from '../Avatar';
import {
  useChatContext,
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
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
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  const {
    message,
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

  const totalReactionCount = useMemo(
    () =>
      Object.entries(message.reaction_counts ?? {}).reduce(
        (total, [, reactionCount]) => total + reactionCount,
        0,
      ),
    [message.reaction_counts],
  );

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
      className={clsx('str-chat__message-reactions-detail-modal', modalProps.className)}
    >
      <div
        className='str-chat__message-reactions-detail'
        data-testid='reactions-list-modal'
      >
        <div className='str-chat__message-reactions-detail__total-count'>
          {t('{{ count }} reactions', { count: totalReactionCount })}
        </div>
        <div className='str-chat__message-reactions-detail__reaction-type-list-container'>
          <ul className='str-chat__message-reactions-detail__reaction-type-list'>
            {reactions.map(
              ({ EmojiComponent, reactionCount, reactionType }) =>
                EmojiComponent && (
                  <li
                    className='str-chat__message-reactions-detail__reaction-type-list-item'
                    key={reactionType}
                  >
                    <button
                      aria-pressed={reactionType === selectedReactionType}
                      className='str-chat__message-reactions-detail__reaction-type-list-item-button'
                      onClick={() => onSelectedReactionTypeChange?.(reactionType)}
                    >
                      <span className='str-chat__message-reactions-detail__reaction-type-list-item-icon'>
                        <EmojiComponent />
                      </span>
                      {reactionCount > 1 && (
                        <span
                          className='str-chat__message-reactions-detail__reaction-type-list-item-count'
                          data-testclass='message-reactions-item-count'
                        >
                          {reactionCount}
                        </span>
                      )}
                    </button>
                  </li>
                ),
            )}
          </ul>
        </div>
        <div
          className='str-chat__message-reactions-detail__user-list'
          data-testid='all-reacting-users'
        >
          {areReactionsLoading ? (
            <LoadingIndicator />
          ) : (
            reactionDetailsWithLegacyFallback.map(({ user }) => {
              const belongsToCurrentUser = client.user?.id === user?.id;
              return (
                <div
                  className='str-chat__message-reactions-detail__user-list-item'
                  key={user?.id}
                >
                  <Avatar
                    className='str-chat__avatar--with-border'
                    data-testid='avatar'
                    imageUrl={user?.image as string | undefined}
                    size='sm'
                    userName={user?.name || user?.id}
                  />
                  <div className='str-chat__message-reactions-detail__user-list-item-info'>
                    <span
                      className='str-chat__message-reactions-detail__user-list-item-username'
                      data-testid='reaction-user-username'
                    >
                      {belongsToCurrentUser ? t('You') : user?.name || user?.id}
                    </span>
                    {belongsToCurrentUser && (
                      <button
                        className='str-chat__message-reactions-detail__user-list-item-button'
                        data-testid='remove-reaction-button'
                      >
                        {t('Tap to remove')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
