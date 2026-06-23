import { createContext, useContext } from 'react';

export type AriaLivePriority = 'assertive' | 'polite';
export type AriaLiveAnnounce = (message: string, priority?: AriaLivePriority) => void;

export type AriaLiveAnnouncerContextValue = {
  announce: AriaLiveAnnounce;
};

const noopAnnounce: AriaLiveAnnounce = () => undefined;

export const AriaLiveAnnouncerContext = createContext<
  AriaLiveAnnouncerContextValue | undefined
>(undefined);

export const useAriaLiveAnnouncer = () => {
  const contextValue = useContext(AriaLiveAnnouncerContext);

  if (!contextValue) {
    console.warn(
      'The useAriaLiveAnnouncer hook was called outside of an AriaLiveAnnouncerProvider.',
    );

    return noopAnnounce;
  }

  return contextValue.announce;
};
