// @ts-check
import React from 'react';

/**
 * @typedef {import('types').ChannelContextValue} ChannelContext
 */
export const ChannelContext = React.createContext(
  /** @type {ChannelContext} */ ({}),
);

/** @param { React.ComponentClass | React.FC } OriginalComponent */
export function withChannelContext(OriginalComponent) {
  /** @param {any} props */
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <ChannelContext.Consumer>
        {(channelContext) => (
          <OriginalComponent {...channelContext} {...props} />
        )}
      </ChannelContext.Consumer>
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
