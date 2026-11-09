import React from 'react';

import { useSlotChannel } from './hooks';
import { Channel as ChannelComponent, type ChannelProps } from '../../components/Channel';
import { WorkspacePanelProvider } from '../../context/WorkspaceNavigationContext';

import type { PropsWithChildren, ReactNode } from 'react';
import type { SlotName } from './layoutController/layoutControllerTypes';

export type ChannelSlotProps = PropsWithChildren<
  Omit<ChannelProps, 'channel'> & {
    /** Rendered when no channel is bound to `slot`. */
    fallback?: ReactNode;
    /**
     * The layout slot to render. Pass it explicitly, since several channels can be open side by
     * side. Without it the first slot holding a channel is used, which only suits a single-channel
     * workspace.
     */
    slot?: SlotName;
  }
>;

/**
 * Renders the channel bound to `slot`, or `fallback` when none is. It only displays: navigation
 * decides which channel goes into which slot. To resolve channels from layout bindings yourself
 * (e.g. in custom `slotRenderers`), render `<Channel channel={...} />` directly.
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
    <WorkspacePanelProvider panel={slot}>
      <ChannelComponent {...channelProps} channel={channel}>
        {children}
      </ChannelComponent>
    </WorkspacePanelProvider>
  );
};
