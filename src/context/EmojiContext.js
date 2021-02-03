import React from 'react';

import {
  commonEmoji,
  defaultMinimalEmojis,
} from '../components/Channel/emojiData';

/**
 * @typedef {import('types').EmojiContextValue} EmojiContextProps
 */
export const EmojiContext = React.createContext(
  /** @type {EmojiContextProps} */ ({
    emojiData: {},
    EmojiPicker: null,
    Emoji: null,
    defaultMinimalEmojis,
    commonEmoji,
  }),
);

/**
 * @function
 * @template P
 * @param {React.ComponentType<P>} OriginalComponent
 * @returns {React.ComponentType<Exclude<P, EmojiContextProps>>}
 */
export function withEmojiContext(OriginalComponent) {
  /** @param {Exclude<P, EmojiContextProps>} props */
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <EmojiContext.Consumer>
        {(context) => <OriginalComponent {...context} {...props} />}
      </EmojiContext.Consumer>
    );
  };

  ContextAwareComponent.displayName = (
    OriginalComponent.displayName ||
    OriginalComponent.name ||
    'Component'
  ).replace('Base', '');

  return ContextAwareComponent;
}
