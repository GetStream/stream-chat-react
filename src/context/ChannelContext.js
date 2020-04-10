import React from 'react';
import Dayjs from 'dayjs';

export const ChannelContext = React.createContext({});

export function withChannelContext(OriginalComponent) {
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <ChannelContext.Consumer>
        {(channelContext) => (
          <OriginalComponent {...channelContext} {...props} />
        )}
      </ChannelContext.Consumer>
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

export const TranslationContext = React.createContext({
  t: (msg) => msg,
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
