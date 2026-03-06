import React, { useEffect, useRef } from 'react';

import { useChatViewNavigation, useSlotChannel } from '../ChatView';
import { Channel as ChannelComponent, type ChannelProps } from './Channel';

import type { PropsWithChildren, ReactNode } from 'react';
import type { SlotName } from '../ChatView/layoutController/layoutControllerTypes';

export type ChannelSlotProps = PropsWithChildren<
  Omit<ChannelProps, 'channel'> & {
    /**
     * Rendered when no channel entity can be resolved from the inspected slot(s).
     */
    fallback?: ReactNode;
    /**
     * Explicit layout slot to resolve a channel from.
     *
     * - If provided: this ChannelSlot only inspects that slot.
     * - If omitted: ChannelSlot inspects `availableSlots` and
     *   renders the first slot currently bound to a `kind: 'channel'` entity.
     *
     * In multi-workspace layouts, pass `slot` for each ChannelSlot instance to
     * avoid multiple ChannelSlots resolving the same active channel.
     */
    slot?: SlotName;
  }
>;

/**
 * ChatView-aware channel adapter.
 *
 * Expected usage:
 * - Single channel workspace: render one `<ChannelSlot />` without `slot`.
 * - Multi-channel workspace: render one `<ChannelSlot slot='slotX' />` per slot.
 *
 * If your app already resolves channel instances directly from layout bindings
 * (e.g. via custom `slotRenderers`), you can render `<Channel channel={...} />`
 * directly and skip ChannelSlot.
 */
export const ChannelSlot = ({
  children,
  fallback = null,
  slot,
  ...channelProps
}: ChannelSlotProps) => {
  const { openChannel } = useChatViewNavigation();
  const channel = useSlotChannel({ slot });
  const existingChannel = useSlotChannel();
  const lastClaimKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!slot || channel || !existingChannel?.cid) return;

    const claimKey = `${slot}:${existingChannel.cid}`;
    if (lastClaimKeyRef.current === claimKey) return;

    lastClaimKeyRef.current = claimKey;
    openChannel(existingChannel, { slot });
  }, [channel, existingChannel, openChannel, slot]);

  if (!channel) return <>{fallback}</>;

  return (
    <ChannelComponent {...channelProps} channel={channel}>
      {children}
    </ChannelComponent>
  );
};
