import { useEffect, useMemo, useState } from 'react';
import type { OwnCapabilitiesState } from 'stream-chat';
import {
  asDynamicKey,
  ListItemLayout,
  Switch,
  useNotificationApi,
  useStateStore,
  useTranslationContext,
} from 'stream-chat-react';
import {
  type ChannelManagementActionItem,
  defaultChannelManagementActionSet,
  useChannelDetailContext,
} from 'stream-chat-react/channel-detail';

import { IconLock } from '../icons';

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error('An unknown error occurred');

const selectCanFreeze = ({ ownCapabilities }: OwnCapabilitiesState) => ({
  canFreeze: !!ownCapabilities?.includes('freeze-channel'),
});

const FreezeActionIcon = () => (
  <IconLock className='str-chat__channel-detail__action-icon' />
);

/**
 * Freezes or unfreezes the channel, for a user whose role has the `UpdateChannelFrozen`
 * permission. A frozen channel takes no new messages, which is also how a scheduled message
 * can be made to fail with `channel_frozen`. The SDK ships no freeze action; it is demo code.
 */
const ChannelFreezeAction = () => {
  const { channel } = useChannelDetailContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const { canFreeze } = useStateStore(channel.state, selectCanFreeze);
  const [frozen, setFrozen] = useState(!!channel.data?.frozen);

  // follows a freeze made elsewhere, such as in the dashboard
  useEffect(() => {
    setFrozen(!!channel.data?.frozen);
    const { unsubscribe } = channel.on('channel.updated', ({ channel: data }) => {
      if (data?.frozen !== undefined) setFrozen(data.frozen);
    });
    return unsubscribe;
  }, [channel]);

  const TrailingSlot = useMemo(() => {
    function ChannelFreezeSwitch() {
      return <Switch on={frozen} presentation />;
    }
    return ChannelFreezeSwitch;
  }, [frozen]);

  if (!canFreeze) return null;

  const toggleFrozen = async () => {
    const nextFrozen = !frozen;
    setFrozen(nextFrozen);
    try {
      await channel.updatePartial({ set: { frozen: nextFrozen } });
    } catch (error) {
      setFrozen(!nextFrozen);
      addNotification({
        context: { channel },
        emitter: 'ChannelFreezeAction',
        error: toError(error),
        message: nextFrozen
          ? t(
              asDynamicKey('viteExample.channelFreeze.freezeError.text'),
              "Couldn't freeze the channel",
            )
          : t(
              asDynamicKey('viteExample.channelFreeze.unfreezeError.text'),
              "Couldn't unfreeze the channel",
            ),
        severity: 'error',
        type: 'api:channel:freeze:failed',
      });
    }
  };

  return (
    <ListItemLayout
      LeadingIcon={FreezeActionIcon}
      RootElement='button'
      rootProps={{
        'aria-pressed': frozen,
        className:
          'str-chat__form__switch-field str-chat__channel-management-view-action',
        onClick: toggleFrozen,
      }}
      title={t(asDynamicKey('viteExample.channelFreeze.title'), 'Freeze channel')}
      TrailingSlot={TrailingSlot}
    />
  );
};

/** The SDK's channel actions with the freeze switch after Mute chat. */
export const channelManagementActionSetWithFreeze: ChannelManagementActionItem[] =
  defaultChannelManagementActionSet.flatMap((action) =>
    action.type === 'muteChannel'
      ? [action, { Component: ChannelFreezeAction, type: 'freezeChannel' }]
      : [action],
  );
