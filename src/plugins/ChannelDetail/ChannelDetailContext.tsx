import type { PropsWithChildren } from 'react';
import React, { useContext, useMemo } from 'react';
import type { Channel } from 'stream-chat';

import { ModalContext, type ModalContextValue } from '../../context/ModalContext';
import { useStableCallback } from '../../utils';

export type ChannelDetailContextValue = {
  channel: Channel;
  /**
   * Closes the channel detail: the views' close buttons and the actions that close the channel
   * detail when they finish call it. It is the `close` of the nearest modal context, which
   * `ChannelDetailProvider` replaces with its `onClose` when it is given. `undefined` when there is
   * neither, for example in a side panel without `onClose`, so `Prompt.Header` renders no close
   * button.
   */
  close?: () => void;
};

type ChannelDetailProvidedValue = Pick<ChannelDetailContextValue, 'channel'>;

const ChannelDetailContext = React.createContext<ChannelDetailProvidedValue | undefined>(
  undefined,
);

/**
 * The modal context for the provider's subtree. With `onClose`, it is the surrounding modal's
 * context (if any) with `close` replaced by `onClose`; without it, the surrounding one unchanged.
 * The views read `close` from the nearest modal context, so `onClose` wins over a modal around the
 * provider, and a modal opened inside it wins over `onClose`.
 */
const useCreateChannelDetailModalContext = (
  onClose: (() => void) | undefined,
): ModalContextValue | undefined => {
  const surroundingModalContext = useContext(ModalContext);
  // Stable while `onClose` is given, so an inline `onClose` does not re-render every consumer.
  const stableOnClose = useStableCallback(() => onClose?.());
  const hasOnClose = !!onClose;

  return useMemo(
    () =>
      hasOnClose
        ? { ...surroundingModalContext, close: stableOnClose }
        : surroundingModalContext,
    [hasOnClose, stableOnClose, surroundingModalContext],
  );
};

export type ChannelDetailProviderProps = PropsWithChildren<{
  channel: Channel;
  /**
   * Closes the channel detail: the views' close buttons and the actions that close the channel
   * detail when they finish call it. Inside a modal it is called instead of the modal's `close`, so
   * close the modal from it. A modal opened inside the channel detail still closes itself. Without
   * it and outside a modal, the views render no close button.
   */
  onClose?: () => void;
}>;

export const ChannelDetailProvider = ({
  channel,
  children,
  onClose,
}: ChannelDetailProviderProps) => {
  const value = useMemo(() => ({ channel }), [channel]);
  const modalContext = useCreateChannelDetailModalContext(onClose);

  return (
    <ModalContext.Provider value={modalContext}>
      <ChannelDetailContext.Provider value={value}>
        {children}
      </ChannelDetailContext.Provider>
    </ModalContext.Provider>
  );
};

export const useChannelDetailContext = (): ChannelDetailContextValue => {
  const providedValue = useContext(ChannelDetailContext);
  // Read where the hook is called, not in the provider, so a modal opened inside the channel
  // detail closes itself. `useModalContext` would return a no-op `close` outside a modal.
  const close = useContext(ModalContext)?.close;
  const contextValue = useMemo(
    () => providedValue && { ...providedValue, close },
    [close, providedValue],
  );

  if (!contextValue) {
    throw new Error(
      'The useChannelDetailContext hook was called outside of ChannelDetailProvider.',
    );
  }

  return contextValue;
};
