import React from 'react';

import type { CustomMessageActions } from '../../context/MessageContext';

import type { StreamMessage } from '../../context/ChannelStateContext';

export type CustomMessageActionsListProps = {
  message: StreamMessage;
  customMessageActions?: CustomMessageActions;
};

export const CustomMessageActionsList = (props: CustomMessageActionsListProps) => {
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
