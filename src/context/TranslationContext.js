import React from 'react';
import Dayjs from 'dayjs';

export const TranslationContext = React.createContext({
  // eslint-disable-next-line
  t: (msg, options) => msg,
  tDateTimeParser: (input) => Dayjs(input),
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
