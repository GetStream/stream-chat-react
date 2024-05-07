import React, { useMemo } from 'react';
import clsx from 'clsx';

import type { ReactionDetailsComparator, ReactionSummary, ReactionType } from './types';

import { Modal, ModalProps } from '../Modal';
import { useFetchReactions } from './hooks/useFetchReactions';
import { LoadingIndicator } from '../Loading';
import { Avatar } from '../Avatar';
import { MessageContextValue, useMessageContext } from '../../context';
import { DefaultStreamChatGenerics } from '../../types/types';
import { ReactionSort } from 'stream-chat';

type ReactionsListModalProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = ModalProps &
  Partial<
    Pick<MessageContextValue<StreamChatGenerics>, 'handleFetchReactions' | 'reactionDetailsSort'>
  > & {
    reactions: ReactionSummary[];
    selectedReactionType: ReactionType<StreamChatGenerics>;
    onSelectedReactionTypeChange?: (reactionType: ReactionType<StreamChatGenerics>) => void;
    sort?: ReactionSort<StreamChatGenerics>;
    /** @deprecated use `sort` instead */
    sortReactionDetails?: ReactionDetailsComparator;
  };

const defaultSortReactionDetails: ReactionDetailsComparator = (a, b) => {
  const aName = a.user?.name ?? a.user?.id;
  const bName = b.user?.name ?? b.user?.id;
  return aName ? (bName ? aName.localeCompare(bName, 'en') : -1) : 1;
};

const defaultReactionDetailsSort = { created_at: -1 } as const;

export function ReactionsListModal<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  handleFetchReactions,
  onSelectedReactionTypeChange,
  reactionDetailsSort: propReactionDetailsSort,
  reactions,
  selectedReactionType,
  sortReactionDetails: propSortReactionDetails,
  ...modalProps
}: ReactionsListModalProps<StreamChatGenerics>) {
  const selectedReaction = reactions.find(
    ({ reactionType }) => reactionType === selectedReactionType,
  );
  const SelectedEmojiComponent = selectedReaction?.EmojiComponent ?? null;
  const {
    reactionDetailsSort: contextReactionDetailsSort,
    sortReactionDetails: contextSortReactionDetails,
  } = useMessageContext('ReactionsListModal');
  const legacySortReactionDetails =
    propSortReactionDetails ?? contextSortReactionDetails ?? defaultSortReactionDetails;
  const reactionDetailsSort =
    propReactionDetailsSort ?? contextReactionDetailsSort ?? defaultReactionDetailsSort;
  const { isLoading: areReactionsLoading, reactions: allReactions } = useFetchReactions({
    handleFetchReactions,
    reactionType: selectedReactionType,
    shouldFetch: modalProps.open,
    sort: reactionDetailsSort,
  });

  const currentReactions = useMemo(() => {
    if (!selectedReactionType) {
      return [];
    }

    const unsortedCurrentReactions = allReactions.filter(
      (reaction) => reaction.type === selectedReactionType && reaction.user,
    );

    return unsortedCurrentReactions.sort(legacySortReactionDetails);
  }, [allReactions, selectedReactionType, legacySortReactionDetails]);

  return (
    <Modal {...modalProps}>
      <div className='str-chat__message-reactions-details' data-testid='reactions-list-modal'>
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
                    onSelectedReactionTypeChange?.(reactionType as ReactionType<StreamChatGenerics>)
                  }
                >
                  <span className='emoji str-chat__message-reaction-emoji str-chat__message-reaction-emoji--with-fallback'>
                    <EmojiComponent />
                  </span>
                  &nbsp;
                  <span className='str-chat__message-reaction-count'>{reactionCount}</span>
                </div>
              ),
          )}
        </div>
        {SelectedEmojiComponent && (
          <div className='emoji str-chat__message-reaction-emoji str-chat__message-reaction-emoji--with-fallback str-chat__message-reaction-emoji-big'>
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
            currentReactions.map(({ user }) => (
              <div className='str-chat__message-reactions-details-reacting-user' key={user?.id}>
                <Avatar
                  data-testid='avatar'
                  image={user?.image as string | undefined}
                  name={user?.name || user?.id}
                />
                <span className='str-chat__user-item--name' data-testid='reaction-user-username'>
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
