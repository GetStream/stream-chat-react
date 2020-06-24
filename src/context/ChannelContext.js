// @ts-check

import React from 'react';

/**
 * @typedef {import('types').ChannelContextValue} ChannelContextProps
 */

export const ChannelContext = React.createContext(
  /** @type {ChannelContextProps} */ ({}),
);

/**
 * @function
 * @template P
 * @param { React.ComponentType<P> } OriginalComponent
 * @returns {React.ComponentType<Exclude<P, ChannelContextProps>>}
 */
export function withChannelContext(OriginalComponent) {
  /** @param {Exclude<P, ChannelContextProps>} props */
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <ChannelContext.Consumer>
        {(context) => <OriginalComponent {...context} {...props} />}
      </ChannelContext.Consumer>
    );
  };

  ContextAwareComponent.displayName = (
    OriginalComponent.displayName ||
    OriginalComponent.name ||
    'Component'
  ).replace('Base', '');

  return ContextAwareComponent;
}
