// @ts-check

import React from 'react';
import Dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

Dayjs.extend(LocalizedFormat);

/**
 * @typedef {Required<import('types').TranslationContextValue>} TranslationContextProps
 */

export const TranslationContext = React.createContext(
  /** @type {TranslationContextProps} */ ({
    t: /** @param {string} key */ (key) => key,
    tDateTimeParser: (input) => Dayjs(input),
  }),
);

/**
 * @function
 * @template P
 * @param {React.ComponentType<P>} OriginalComponent
 * @returns {React.ComponentType<Exclude<P, TranslationContextProps>>}
 */
export function withTranslationContext(OriginalComponent) {
  /** @param {Exclude<P, TranslationContextProps>} props */
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <TranslationContext.Consumer>
        {(context) => <OriginalComponent {...context} {...props} />}
      </TranslationContext.Consumer>
    );
  };

  ContextAwareComponent.displayName = (
    OriginalComponent.displayName ||
    OriginalComponent.name ||
    'Component'
  ).replace('Base', '');

  return ContextAwareComponent;
}
