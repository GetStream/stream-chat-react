import React, { useMemo } from 'react';
import clsx from 'clsx';

import { Modal, ModalProps } from '../Modal';
import { ReactionSummary } from './types';
import { useFetchReactions } from './hooks/useFetchReactions';
import { LoadingIndicator } from '../Loading';
import { Avatar } from '../Avatar';
import { MessageContextValue } from '../../context';
import { DefaultStreamChatGenerics } from '../../types/types';

type ReactionsListModalProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = ModalProps &
  Partial<Pick<MessageContextValue<StreamChatGenerics>, 'handleFetchReactions'>> & {
    reactions: ReactionSummary[];
    selectedReactionType: string | null;
    onSelectedReactionTypeChange?: (reactionType: string) => void;
  };

export function ReactionsListModal({
  handleFetchReactions,
  onSelectedReactionTypeChange,
  reactions,
  selectedReactionType,
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
  const currentReactions = useMemo(() => {
    if (!selectedReactionType) {
      return [];
    }

    return allReactions.filter(
      (reaction) => reaction.type === selectedReactionType && reaction.user,
    );
  }, [allReactions, selectedReactionType]);

  return (
    <Modal {...modalProps}>
      <div className='str-chat__message-reactions-details'>
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
                  <span className='emoji str-chat__message-reaction-emoji'>
                    <EmojiComponent />
                  </span>
                  &nbsp;
                  <span className='str-chat__message-reaction-count'>{reactionCount}</span>
                </div>
              ),
          )}
        </div>
        {SelectedEmojiComponent && (
          <div className='emoji str-chat__message-reaction-emoji str-chat__message-reaction-emoji-big'>
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
                  data-testclass='avatar'
                  image={user?.image as string | undefined}
                  name={user?.name || user?.id}
                />
                <span className='str-chat__user-item--name' data-testclass='reaction-user-username'>
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
