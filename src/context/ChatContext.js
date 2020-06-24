// @ts-check
import React from 'react';

/**
 * @typedef {import('types').ChatContextValue} ChatContextProps
 */

export const ChatContext = React.createContext(
  /** @type {ChatContextProps} */ ({ client: null }),
);

/**
 * @function
 * @template P
 * @param {React.ComponentType<P>} OriginalComponent
 * @returns {React.ComponentType<Exclude<P, ChatContextProps>>}
 */
export function withChatContext(OriginalComponent) {
  /** @param {Exclude<P, ChatContextProps>} props */
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <ChatContext.Consumer>
        {(context) => <OriginalComponent {...context} {...props} />}
      </ChatContext.Consumer>
    );
  };

  ContextAwareComponent.displayName = (
    OriginalComponent.displayName ||
    OriginalComponent.name ||
    'Component'
  ).replace('Base', '');

  return ContextAwareComponent;
}
