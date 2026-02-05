import React from 'react';

import type { LocalMessage } from 'stream-chat';
import type { CustomMessageActions } from '../../context/MessageContext';

export type CustomMessageActionsListProps = {
  closeMenu?: () => void;
  message: LocalMessage;
  customMessageActions?: CustomMessageActions;
};

export const CustomMessageActionsList = (props: CustomMessageActionsListProps) => {
  const { closeMenu, customMessageActions, message } = props;

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
            onClick={(event) => {
              customHandler(message, event);
              closeMenu?.();
            }}
            role='option'
          >
            {customAction}
          </button>
        );
      })}
    </>
  );
};
