import React, { useMemo } from 'react';
import clsx from 'clsx';

import { useDialog } from '../Dialog';
import { defaultReactionOptions } from './reactionOptions';
import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';
import { Button } from '../Button';
import { IconPlusLarge } from '../Icons';

import type { ReactionResponse } from 'stream-chat';

export type ReactionSelectorProps = {
  /** Function that adds/removes a reaction on a message (overrides the function stored in `MessageContext`) */
  handleReaction?: (
    reactionType: string,
    event: React.BaseSyntheticEvent,
  ) => Promise<void>;
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse[];
};

const stableOwnReactions: ReactionResponse[] = [];

const UnMemoizedReactionSelector = (props: ReactionSelectorProps) => {
  const { handleReaction: propHandleReaction, own_reactions: propOwnReactions } = props;

  const { reactionOptions = defaultReactionOptions } =
    useComponentContext('ReactionSelector');

  const {
    closeReactionSelectorOnClick,
    handleReaction: contextHandleReaction,
    message,
  } = useMessageContext('ReactionSelector');
  const dialogId = `reaction-selector--${message.id}`;
  const dialog = useDialog({ id: dialogId });

  const handleReaction = propHandleReaction ?? contextHandleReaction;
  const ownReactions = propOwnReactions ?? message?.own_reactions ?? stableOwnReactions;

  const ownReactionByType = useMemo(() => {
    const map: { [key: string]: ReactionResponse } = {};

    for (const reaction of ownReactions) {
      map[reaction.type] ??= reaction;
    }

    return map;
  }, [ownReactions]);

  return (
    <div className='str-chat__reaction-selector' data-testid='reaction-selector'>
      <ul className='str-chat__reaction-selector-list'>
        {reactionOptions.map(({ Component, name: reactionName, type: reactionType }) => (
          <li className='str-chat__reaction-list-selector__item' key={reactionType}>
            <button
              aria-label={`Select Reaction: ${reactionName || reactionType}`}
              aria-pressed={typeof ownReactionByType[reactionType] !== 'undefined'}
              className={clsx('str-chat__reaction-selector-list__item-button')}
              data-testid='select-reaction-button'
              data-text={reactionType}
              onClick={(event) => {
                handleReaction(reactionType, event);
                if (closeReactionSelectorOnClick) {
                  dialog.close();
                }
              }}
            >
              <span className='str-chat__reaction-icon'>
                <Component />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Button
        appearance='outline'
        circular
        className='str-chat__reaction-selector__add-button'
        size='sm'
        variant='secondary'
      >
        <IconPlusLarge />
      </Button>
    </div>
  );
};

/**
 * Component that allows a user to select a reaction.
 */
export const ReactionSelector = React.memo(
  UnMemoizedReactionSelector,
) as typeof UnMemoizedReactionSelector;
