import React, { useMemo, useState } from 'react';

import type { ReactionSummary, ReactionType } from './types';

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
import type { useProcessReactions } from './hooks/useProcessReactions';
import { IconEmojiAdd } from '../Icons';
import { ReactionSelector, type ReactionSelectorProps } from './ReactionSelector';

export type MessageReactionsDetailProps = Partial<
  Pick<MessageContextValue, 'handleFetchReactions' | 'reactionDetailsSort'>
> & {
  reactions: ReactionSummary[];
  selectedReactionType: ReactionType | null;
  onSelectedReactionTypeChange?: (reactionType: ReactionType | null) => void;
  sort?: ReactionSort;
  totalReactionCount?: number;
  reactionGroups?: ReturnType<typeof useProcessReactions>['reactionGroups'];
} & ReactionSelectorProps;

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

interface MessageReactionsDetailInterface {
  (props: MessageReactionsDetailProps): React.ReactNode;
  displayName: string;
  getDialogId: (_: { messageId: string }) => string;
}

export const MessageReactionsDetail: MessageReactionsDetailInterface = ({
  handleFetchReactions,
  handleReaction,
  onSelectedReactionTypeChange,
  own_reactions,
  reactionDetailsSort: propReactionDetailsSort,
  reactionGroups,
  reactions,
  selectedReactionType,
  totalReactionCount,
}) => {
  const [extendedReactionListOpen, setExtendedReactionListOpen] = useState(false);
  const { client } = useChatContext();
  const {
    Avatar = DefaultAvatar,
    LoadingIndicator = MessageReactionsDetailLoadingIndicator,
    reactionOptions = defaultReactionOptions,
    ReactionSelectorExtendedList = ReactionSelector.ExtendedList,
  } = useComponentContext(MessageReactionsDetail.name);
  const { t } = useTranslationContext();

  const {
    handleReaction: contextHandleReaction,
    message,
    reactionDetailsSort: contextReactionDetailsSort,
  } = useMessageContext(MessageReactionsDetail.name);

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

  if (extendedReactionListOpen) {
    return (
      <div
        className='str-chat__message-reactions-detail'
        data-testid='message-reactions-detail'
      >
        <ReactionSelectorExtendedList
          dialogId={MessageReactionsDetail.getDialogId({ messageId: message.id })}
          handleReaction={handleReaction}
          own_reactions={own_reactions}
        />
      </div>
    );
  }

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
        <ul
          className='str-chat__message-reactions-detail__reaction-type-list'
          data-testid='reaction-type-list'
        >
          <li className='str-chat__message-reactions-detail__reaction-type-list-item'>
            <button
              aria-label={t('Add reaction')}
              className='str-chat__message-reactions-detail__reaction-type-list-item-button'
              data-testid='add-reaction-button'
              onClick={() => setExtendedReactionListOpen(true)}
            >
              <span className='str-chat__message-reactions-detail__reaction-type-list-item-icon'>
                <IconEmojiAdd />
              </span>
            </button>
          </li>

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
                    <span
                      className='str-chat__message-reactions-detail__reaction-type-list-item-count'
                      data-testid='reaction-type-count'
                    >
                      {reactionCount}
                    </span>
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
            {reactionDetails.map(({ type, user }) => {
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
                          const reactionCountBeforeRemoval =
                            reactionGroups?.[type]?.count ?? 0;

                          await contextHandleReaction(type, e);

                          // was 1, should be 0 after removal, display all reactions
                          if (
                            selectedReactionType !== null &&
                            reactionCountBeforeRemoval <= 1
                          ) {
                            onSelectedReactionTypeChange?.(null);
                          } else {
                            refetch();
                          }
                        }}
                      >
                        {t('Tap to remove')}
                      </button>
                    )}
                  </div>
                  <span className='str-chat__message-reactions-detail__user-list-item-icon'>
                    {!selectedReactionType && EmojiComponent && <EmojiComponent />}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

MessageReactionsDetail.displayName = 'MessageReactionsDetail';

MessageReactionsDetail.getDialogId = ({ messageId }) =>
  `message-reactions-detail-${messageId}`;
