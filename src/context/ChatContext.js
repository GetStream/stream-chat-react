// @ts-check
import React from 'react';

/**
 * @typedef {import('types').ChatContextValue} ChatContext
 */
export const ChatContext = React.createContext(
  /** @type {ChatContext} */ { client: null },
);

/** @param { React.ComponentClass | React.FC } OriginalComponent */
export function withChatContext(OriginalComponent) {
  /** @param {any} props */
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <ChatContext.Consumer>
        {(context) => {
          const mergedProps = { ...context, ...props };
          return <OriginalComponent {...mergedProps} />;
        }}
      </ChatContext.Consumer>
    );
  };
  /** @type {string} */
  ContextAwareComponent.displayName =
    OriginalComponent.displayName || OriginalComponent.name || 'Component';
  ContextAwareComponent.displayName = ContextAwareComponent.displayName.replace(
    'Base',
    '',
  );

  return ContextAwareComponent;
}
