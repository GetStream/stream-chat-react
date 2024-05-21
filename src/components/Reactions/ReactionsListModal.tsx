import React, { useMemo } from 'react';
import clsx from 'clsx';

import type { ReactionDetailsComparator, ReactionSummary } from './types';

import { Modal, ModalProps } from '../Modal';
import { useFetchReactions } from './hooks/useFetchReactions';
import { LoadingIndicator } from '../Loading';
import { Avatar } from '../Avatar';
import { MessageContextValue, useMessageContext } from '../../context';
import { DefaultStreamChatGenerics } from '../../types/types';

type ReactionsListModalProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = ModalProps &
  Partial<Pick<MessageContextValue<StreamChatGenerics>, 'handleFetchReactions'>> & {
    reactions: ReactionSummary[];
    selectedReactionType: string | null;
    onSelectedReactionTypeChange?: (reactionType: string) => void;
    sortReactionDetails?: ReactionDetailsComparator;
  };

const defaultSortReactionDetails: ReactionDetailsComparator = (a, b) => {
  const aName = a.user?.name ?? a.user?.id;
  const bName = b.user?.name ?? b.user?.id;
  return aName ? (bName ? aName.localeCompare(bName, 'en') : -1) : 1;
};

export function ReactionsListModal({
  handleFetchReactions,
  onSelectedReactionTypeChange,
  reactions,
  selectedReactionType,
  sortReactionDetails: propSortReactionDetails,
  ...modalProps
}: ReactionsListModalProps) {
  const selectedReaction = reactions.find(
    ({ reactionType }) => reactionType === selectedReactionType,
  );
  const SelectedEmojiComponent = selectedReaction?.EmojiComponent ?? null;
  const { isLoading: areReactionsLoading, reactions: allReactions } = useFetchReactions({
    handleFetchReactions,
    shouldFetch: modalProps.open,
  });
  const { sortReactionDetails: contextSortReactionDetails } = useMessageContext(
    'ReactionsListModal',
  );
  const sortReactionDetails =
    propSortReactionDetails ?? contextSortReactionDetails ?? defaultSortReactionDetails;
  const currentReactions = useMemo(() => {
    if (!selectedReactionType) {
      return [];
    }

    const unsortedCurrentReactions = allReactions.filter(
      (reaction) => reaction.type === selectedReactionType && reaction.user,
    );

    return unsortedCurrentReactions.sort(sortReactionDetails);
  }, [allReactions, selectedReactionType, sortReactionDetails]);

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
                  onClick={() => onSelectedReactionTypeChange?.(reactionType)}
                >
                  <span className='str-chat__message-reaction-emoji str-chat__message-reaction-emoji--with-fallback'>
                    <EmojiComponent />
                  </span>
                  &nbsp;
                  <span className='str-chat__message-reaction-count'>{reactionCount}</span>
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
            currentReactions.map(({ user }) => (
              <div className='str-chat__message-reactions-details-reacting-user' key={user?.id}>
                <Avatar
                  className='stream-chat__avatar--reaction'
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
