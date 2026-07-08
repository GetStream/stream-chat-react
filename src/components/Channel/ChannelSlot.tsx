import React from 'react';

import { useSlotChannel } from '../ChatView';
import { Channel as ChannelComponent, type ChannelProps } from './Channel';

import type { PropsWithChildren, ReactNode } from 'react';
import type { SlotName } from '../ChatView/layoutController/layoutControllerTypes';

export type ChannelSlotProps = PropsWithChildren<
  Omit<ChannelProps, 'channel'> & {
    /** Rendered when no channel is bound to `slot`. */
    fallback?: ReactNode;
    /**
     * The layout slot this adapter renders. Always pass an explicit `slot` — a
     * generic list/workspace must be precise about which slot it displays (multiple
     * channels can be open side by side). Omitting it falls back to the first
     * channel slot and is only meaningful for a single-channel workspace.
     */
    slot?: SlotName;
  }
>;

/**
 * ChatView-aware channel adapter: renders the channel bound to `slot`.
 *
 * It only *displays* — it never adopts/moves a channel from another slot. Which
 * channel goes into which slot is decided by navigation (`open`). If your app
 * resolves channel instances directly from layout bindings (e.g. via custom
 * `slotRenderers`), render `<Channel channel={...} />` directly and skip this.
 */
export const ChannelSlot = ({
  children,
  fallback = null,
  slot,
  ...channelProps
}: ChannelSlotProps) => {
  const channel = useSlotChannel({ slot });

  if (!channel) return <>{fallback}</>;

  return (
    <ChannelComponent {...channelProps} channel={channel}>
      {children}
    </ChannelComponent>
  );
};
