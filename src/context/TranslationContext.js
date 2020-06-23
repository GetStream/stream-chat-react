import React from 'react';
import Dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

const extendedDayjs = Dayjs.extend(LocalizedFormat);

/** @type {React.Context<{ t: import("i18next").TFunction, tDateTimeParser: (msg: string) => Dayjs.Dayjs }>} */
export const TranslationContext = React.createContext({
  t: /** @param {string} key */ (key) => key,
  tDateTimeParser: (input) => extendedDayjs(input),
});

/**
 * @function
 * @template P
 * @param {React.ComponentType<P>} OriginalComponent
 * @returns {React.ComponentType<Omit<P, 't' | 'tDateTimeParser'>>}>}
 */
export function withTranslationContext(OriginalComponent) {
  /** @param {Omit<P, 't' | 'tDateTimeParser'>} props */
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <TranslationContext.Consumer>
        {(translationContext) => (
          <OriginalComponent {...translationContext} {...props} />
        )}
      </TranslationContext.Consumer>
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
