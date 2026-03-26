import React, { useMemo } from 'react';

import type { ReactionDetailsComparator, ReactionSummary, ReactionType } from './types';

import { useFetchReactions } from './hooks/useFetchReactions';
import { Avatar as DefaultAvatar } from '../Avatar';
import type { MessageContextValue } from '../../context';
import {
  useChatContext,
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import type { ReactionSort } from 'stream-chat';
import { defaultReactionOptions } from './reactionOptions';

export type MessageReactionsDetailProps = Partial<
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

export const MessageReactionsDetailLoadingIndicator = () => {
  const elements = useMemo(
    () =>
      Array.from({ length: 3 }, (_, index) => (
        <div className='str-chat__message-reactions-detail__skeleton-item' key={index}>
          <div className='str-chat__message-reactions-detail__skeleton-avatar' />
          <div className='str-chat__message-reactions-detail__skeleton-line' />
        </div>
      )),
    [],
  );

  return <>{elements}</>;
};

export function MessageReactionsDetail({
  handleFetchReactions,
  onSelectedReactionTypeChange,
  reactionDetailsSort: propReactionDetailsSort,
  reactions,
  selectedReactionType,
  sortReactionDetails: propSortReactionDetails,
  totalReactionCount,
}: MessageReactionsDetailProps) {
  const { client } = useChatContext();
  const {
    Avatar = DefaultAvatar,
    LoadingIndicator = MessageReactionsDetailLoadingIndicator,
    reactionOptions = defaultReactionOptions,
  } = useComponentContext(MessageReactionsDetail.name);
  const { t } = useTranslationContext();

  const {
    handleReaction: contextHandleReaction,
    reactionDetailsSort: contextReactionDetailsSort,
    sortReactionDetails: contextSortReactionDetails,
  } = useMessageContext(MessageReactionsDetail.name);

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
      data-testid='message-reactions-detail'
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
                    onClick={() =>
                      onSelectedReactionTypeChange?.(
                        selectedReactionType === reactionType ? null : reactionType,
                      )
                    }
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
        {areReactionsLoading && <LoadingIndicator />}
        {!areReactionsLoading && (
          <>
            {reactionDetailsWithLegacyFallback.map(({ type, user }) => {
              const belongsToCurrentUser = client.user?.id === user?.id;
              const EmojiComponent = Array.isArray(reactionOptions)
                ? undefined
                : (reactionOptions.quick[type]?.Component ??
                  reactionOptions.extended?.[type]?.Component);

              return (
                <div
                  className='str-chat__message-reactions-detail__user-list-item'
                  key={`${user?.id}-${type}`}
                >
                  <Avatar
                    className='str-chat__avatar--with-border'
                    data-testid='avatar'
                    imageUrl={user?.image as string | undefined}
                    size='md'
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
                        onClick={async (e) => {
                          await contextHandleReaction(type, e);
                          refetch();
                        }}
                      >
                        {t('Tap to remove')}
                      </button>
                    )}
                  </div>
                  <span className='str-chat__message-reactions-detail__user-list-item-icon'>
                    {EmojiComponent && !selectedReactionType && <EmojiComponent />}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
