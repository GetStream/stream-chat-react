import React, { type ReactNode, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { DialogAnchor, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import { defaultReactionOptions } from './reactionOptions';
import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';
import { Button } from '../Button';
import { IconPlus } from '../Icons';

import type { ReactionResponse } from 'stream-chat';

export type ReactionSelectorProps = {
  /** Override dialog id used by the selector popover. */
  dialogId?: string;
  /** Optional anchor for selector dialogs; when provided, extended selector uses this anchor as well. */
  referenceElement?: HTMLElement | null;
  /** Function that adds/removes a reaction on a message (overrides the function stored in `MessageContext`) */
  handleReaction?: (
    reactionType: string,
    event: React.BaseSyntheticEvent,
  ) => Promise<void>;
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse[];
};

interface ReactionSelectorInterface {
  (props: ReactionSelectorProps): ReactNode;
  getDialogId: (_: { messageId: string; threadList?: boolean }) => string;
  displayName: string;
  ExtendedList: React.ComponentType<ReactionSelectorProps & { dialogId?: string }>;
}

const stableOwnReactions: ReactionResponse[] = [];

export const ReactionSelector: ReactionSelectorInterface = (props) => {
  const {
    dialogId: propDialogId,
    handleReaction: propHandleReaction,
    own_reactions: propOwnReactions,
    referenceElement: propReferenceElement,
  } = props;
  const [extendedReferenceElement, setExtendedReferenceElement] =
    useState<HTMLElement | null>(null);

  const {
    reactionOptions = defaultReactionOptions,
    ReactionSelectorExtendedList = ReactionSelector.ExtendedList,
  } = useComponentContext('ReactionSelector');

  const {
    closeReactionSelectorOnClick,
    handleReaction: contextHandleReaction,
    isMyMessage,
    message,
    threadList,
  } = useMessageContext('ReactionSelector');
  const dialogId =
    propDialogId ??
    ReactionSelector.getDialogId({
      messageId: message.id,
      threadList,
    });
  const { dialog } = useDialogOnNearestManager({ id: dialogId });
  const extendedDialogId = `${dialogId}-extended`;
  const { dialog: extendedDialog, dialogManager: extendedDialogManager } =
    useDialogOnNearestManager({ id: extendedDialogId });
  const extendedDialogIsOpen = useDialogIsOpen(
    extendedDialogId,
    extendedDialogManager?.id,
  );

  useEffect(() => {
    if (extendedDialogIsOpen) return;
    setExtendedReferenceElement(null);
  }, [extendedDialogIsOpen]);

  useEffect(() => {
    if (!extendedReferenceElement || extendedDialogIsOpen) return;
    extendedDialog.open();
  }, [extendedDialog, extendedDialogIsOpen, extendedReferenceElement]);

  const handleReaction = propHandleReaction ?? contextHandleReaction;
  const ownReactions = propOwnReactions ?? message?.own_reactions ?? stableOwnReactions;

  const ownReactionByType = useMemo(() => {
    const map: { [key: string]: ReactionResponse } = {};

    for (const reaction of ownReactions) {
      map[reaction.type] ??= reaction;
    }

    return map;
  }, [ownReactions]);

  const adjustedQuickReactionOptions = useMemo(() => {
    if (Array.isArray(reactionOptions)) return reactionOptions;

    return Object.entries(reactionOptions.quick).map(
      ([type, { Component, name, unicode }]) => ({
        Component,
        name,
        type,
        unicode,
      }),
    );
  }, [reactionOptions]);

  return (
    <>
      <DialogAnchor
        dialogManagerId={extendedDialogManager?.id}
        id={extendedDialogId}
        offset={8}
        placement={
          typeof isMyMessage === 'function' && isMyMessage() ? 'top-end' : 'top-start'
        }
        referenceElement={propReferenceElement ?? extendedReferenceElement}
        trapFocus
      >
        <div className='str-chat__reaction-selector'>
          <ReactionSelectorExtendedList
            {...props}
            dialogId={extendedDialogId}
            handleReaction={async (reactionType, event) => {
              await handleReaction(reactionType, event);
              if (closeReactionSelectorOnClick) {
                dialog.close();
              }
            }}
          />
        </div>
      </DialogAnchor>
      {!extendedDialogIsOpen && (
        <div className='str-chat__reaction-selector' data-testid='reaction-selector'>
          <ul
            className='str-chat__reaction-selector-list'
            data-testid='reaction-selector-list'
          >
            {adjustedQuickReactionOptions.map(
              ({ Component, name: reactionName, type: reactionType }) => (
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
              ),
            )}
          </ul>
          <Button
            appearance='outline'
            circular
            className='str-chat__reaction-selector__add-button'
            data-testid='reaction-selector-add-button'
            onClick={(event) => {
              if (propReferenceElement) {
                extendedDialog.open();
                return;
              }
              setExtendedReferenceElement(event.currentTarget);
            }}
            size='sm'
            variant='secondary'
          >
            <IconPlus />
          </Button>
        </div>
      )}
    </>
  );
};

ReactionSelector.getDialogId = ({ messageId, threadList }) => {
  const dialogIdNamespace = threadList ? '-thread' : '';
  return `reaction-selector${dialogIdNamespace}-${messageId}`;
};

ReactionSelector.displayName = 'ReactionSelector';

ReactionSelector.ExtendedList = function ReactionSelectorExtendedList({
  dialogId,
  handleReaction: propHandleReaction,
  own_reactions: propOwnReactions,
}) {
  const { reactionOptions = defaultReactionOptions } = useComponentContext(
    'ReactionSelector.ExtendedList',
  );
  const {
    closeReactionSelectorOnClick,
    handleReaction: contextHandleReaction,
    message,
  } = useMessageContext('ReactionSelector');

  const handleReaction = propHandleReaction ?? contextHandleReaction;
  const ownReactions = propOwnReactions ?? message?.own_reactions ?? stableOwnReactions;

  const { dialog } = useDialogOnNearestManager({ id: dialogId || '' });

  const ownReactionByType = useMemo(() => {
    const map: { [key: string]: ReactionResponse } = {};

    for (const reaction of ownReactions) {
      map[reaction.type] ??= reaction;
    }

    return map;
  }, [ownReactions]);

  if (Array.isArray(reactionOptions) || !reactionOptions.extended) {
    return null;
  }

  return (
    <div
      className='str-chat__reaction-selector-extended-list'
      data-testid='reaction-selector-extended-list'
    >
      {Object.entries(reactionOptions.extended).map(
        ([reactionType, { Component, name: reactionName }]) => (
          <button
            aria-label={`Select Reaction: ${reactionName || reactionType}`}
            aria-pressed={typeof ownReactionByType[reactionType] !== 'undefined'}
            className='str-chat__reaction-selector-extended-list__button str-chat__button str-chat__button--ghost str-chat__button--size-sm str-chat__button--circular'
            data-testid='select-reaction-button'
            data-text={reactionType}
            key={reactionType}
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
        ),
      )}
    </div>
  );
};
