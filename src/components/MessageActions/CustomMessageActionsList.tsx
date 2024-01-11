import React from 'react';

import { CustomMessageActions } from '../../context/MessageContext';

import type { StreamMessage } from '../../context/ChannelStateContext';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type CustomMessageActionsListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  message: StreamMessage<StreamChatGenerics>;
  customMessageActions?: CustomMessageActions<StreamChatGenerics>;
};

/**
 * @deprecated alias for `CustomMessageActionsListProps`, will be removed in the next major release
 */
export type CustomMessageActionsType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = CustomMessageActionsListProps<StreamChatGenerics>;

export const CustomMessageActionsList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: CustomMessageActionsListProps<StreamChatGenerics>,
) => {
  const { customMessageActions, message } = props;

  if (!customMessageActions) return null;

  const customActionsArray = Object.keys(customMessageActions);

  return (
    <>
      {customActionsArray.map((customAction) => {
        const customHandler = customMessageActions[customAction];

        return (
          <button
            aria-selected='false'
            className='str-chat__message-actions-list-item str-chat__message-actions-list-item-button'
            key={customAction}
            onClick={(event) => customHandler(message, event)}
            role='option'
          >
            {customAction}
          </button>
        );
      })}
    </>
  );
};
