import React, { useMemo } from 'react';

import type { ReactionDetailsComparator, ReactionSummary, ReactionType } from './types';

import { useFetchReactions } from './hooks/useFetchReactions';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { Avatar as DefaultAvatar } from '../Avatar';
import {
  useChatContext,
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import type { ReactionSort } from 'stream-chat';
import type { MessageContextValue } from '../../context';

export type ReactionsListModalProps = Partial<
  Pick<MessageContextValue, 'handleFetchReactions' | 'reactionDetailsSort'>
> & {
  reactions: ReactionSummary[];
  selectedReactionType: ReactionType | null;
  onSelectedReactionTypeChange?: (reactionType: ReactionType | null) => void;
  sort?: ReactionSort;
  /** @deprecated use `sort` instead */
  sortReactionDetails?: ReactionDetailsComparator;
  totalReactionCount?: number;
};

const defaultReactionDetailsSort = { created_at: -1 } as const;

// TODO: rename to MessageReactionsDetail
export function ReactionsListModal({
  handleFetchReactions,
  onSelectedReactionTypeChange,
  reactionDetailsSort: propReactionDetailsSort,
  reactions,
  selectedReactionType,
  sortReactionDetails: propSortReactionDetails,
  totalReactionCount,
}: ReactionsListModalProps) {
  const { client } = useChatContext();
  const { Avatar = DefaultAvatar, LoadingIndicator = DefaultLoadingIndicator } =
    useComponentContext('ReactionsListModal');
  const { t } = useTranslationContext();

  const {
    handleReaction: contextHandleReaction,
    reactionDetailsSort: contextReactionDetailsSort,
    sortReactionDetails: contextSortReactionDetails,
  } = useMessageContext('ReactionsListModal');

  const legacySortReactionDetails = propSortReactionDetails ?? contextSortReactionDetails;

  const reactionDetailsSort =
    propReactionDetailsSort ?? contextReactionDetailsSort ?? defaultReactionDetailsSort;

  const {
    isLoading: areReactionsLoading,
    reactions: reactionDetails,
    refetch,
  } = useFetchReactions({
    handleFetchReactions,
    reactionType: selectedReactionType,
    shouldFetch: true,
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
    <div
      className='str-chat__message-reactions-detail'
      data-testid='reactions-list-modal'
    >
      {typeof totalReactionCount === 'number' && (
        <div className='str-chat__message-reactions-detail__total-count'>
          {t('{{ count }} reactions', { count: totalReactionCount })}
        </div>
      )}
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
        {areReactionsLoading && (
          <div className='str-chat__message-reactions-detail__loading-overlay'>
            <LoadingIndicator />
          </div>
        )}
        {reactionDetailsWithLegacyFallback.map(({ user }) => {
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
                {belongsToCurrentUser && selectedReactionType && (
                  <button
                    className='str-chat__message-reactions-detail__user-list-item-button'
                    data-testid='remove-reaction-button'
                    onClick={(e) => {
                      contextHandleReaction(selectedReactionType, e).then(() => {
                        refetch();
                      });
                    }}
                  >
                    {t('Tap to remove')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
