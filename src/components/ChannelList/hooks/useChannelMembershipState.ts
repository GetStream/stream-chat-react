import { useEffect, useState } from 'react';
import type { Channel, ChannelState, ExtendableGenerics } from 'stream-chat';

import { useChatContext } from '../../../context';

export const useChannelMembershipState = <SCG extends ExtendableGenerics>(
  channel?: Channel<SCG>,
) => {
  const [membership, setMembership] = useState<ChannelState<SCG>['membership']>(
    channel?.state.membership || {},
  );

  const { client } = useChatContext<SCG>();

  useEffect(() => {
    if (!channel) return;

    const subscriptions = ['member.updated'].map((v) =>
      client.on(v, () => {
        setMembership(channel.state.membership);
      }),
    );

    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, [client, channel]);

  return membership;
};
