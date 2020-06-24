import React from 'react';
import Dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

const extendedDayjs = Dayjs.extend(LocalizedFormat);

/** @type {React.Context<{ t: import("i18next").TFunction, tDateTimeParser: (msg: string) => Dayjs.Dayjs }>} */
export const TranslationContext = React.createContext({
  t: /** @param {string} key */ (key) => key,
  tDateTimeParser: (input) => extendedDayjs(input),
});

export function withTranslationContext(OriginalComponent) {
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <TranslationContext.Consumer>
        {(translationContext) => (
          <OriginalComponent {...translationContext} {...props} />
        )}
      </TranslationContext.Consumer>
    );
  };
  ContextAwareComponent.displayName =
    OriginalComponent.displayName || OriginalComponent.name || 'Component';
  ContextAwareComponent.displayName = ContextAwareComponent.displayName.replace(
    'Base',
    '',
  );

  return ContextAwareComponent;
}
