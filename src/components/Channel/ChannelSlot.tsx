import React from 'react';

import { useSlotChannel } from '../ChatView';
import { Channel as ChannelComponent, type ChannelProps } from './Channel';

import type { PropsWithChildren, ReactNode } from 'react';
import type { LayoutSlot } from '../ChatView/layoutController/layoutControllerTypes';

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
     * - If omitted: ChannelSlot inspects `[activeSlot, ...visibleSlots]` and
     *   renders the first slot currently bound to a `kind: 'channel'` entity.
     *
     * In multi-workspace layouts, pass `slot` for each ChannelSlot instance to
     * avoid multiple ChannelSlots resolving the same active channel.
     */
    slot?: LayoutSlot;
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
  const channel = useSlotChannel({ slot });

  if (!channel) return <>{fallback}</>;

  return (
    <ChannelComponent {...channelProps} channel={channel}>
      {children}
    </ChannelComponent>
  );
};
