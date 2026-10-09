import { useCallback, useEffect, useState } from 'react';
import type { ChannelUsage, StreamChat } from 'stream-chat';
import { ChannelWatchStatus } from 'stream-chat';
import { Button, Prompt, useChatContext, useDialogIsOpen } from 'stream-chat-react';

import { DraggableDialog } from '../AppSettings/ActionsMenu/DraggableDialog';
import { usePersistentDialog } from '../AppSettings/ActionsMenu/usePersistentDialog';

export const channelStoreDialogId = 'app-channel-store-dialog';

/** Same registration rule as the composer inspector: see `usePersistentDialog`. */
export const useChannelStoreDialog = () => usePersistentDialog(channelStoreDialogId);

// The channel store sends no change notifications, so the table re-reads it on this interval.
const REFRESH_INTERVAL_MS = 1000;

const useChannelUsage = (client: StreamChat, enabled: boolean) => {
  const [usage, setUsage] = useState<ChannelUsage[]>([]);
  const refresh = useCallback(
    () => setUsage(client.channelManager.getChannelUsage()),
    [client],
  );

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, refresh]);

  return { refresh, usage };
};

const ChannelUsageRow = ({
  onChange,
  usage: { channel, key, keptBy },
}: {
  onChange: () => void;
  usage: ChannelUsage;
}) => {
  const watched = channel.watchStatus !== ChannelWatchStatus.NotWatching;

  return (
    <tr className='app__channel-store__row'>
      <td className='app__channel-store__cid' title={key}>
        <div>{channel.id ?? '(no id yet)'}</div>
        <div className='app__channel-store__key'>{key}</div>
      </td>
      <td>{channel.watchStatus}</td>
      <td>
        {keptBy.length ? (
          <div className='app__composer-inspector__flags'>
            {keptBy.map((reason) => (
              <span
                className='app__composer-inspector__flag app__composer-inspector__flag--on'
                key={reason}
              >
                {reason}
              </span>
            ))}
          </div>
        ) : (
          <span className='app__composer-inspector__flag app__composer-inspector__flag--off'>
            released at next release
          </span>
        )}
      </td>
      <td>
        {watched ? (
          <Button
            appearance='ghost'
            onClick={() => {
              void channel
                .stopWatching()
                .catch(() => undefined)
                .finally(onChange);
            }}
            size='sm'
            variant='secondary'
          >
            Stop watching
          </Button>
        ) : (
          <Button
            appearance='ghost'
            onClick={() => {
              void channel
                .watch()
                .catch(() => undefined)
                .finally(onChange);
            }}
            size='sm'
            variant='secondary'
          >
            Watch
          </Button>
        )}
      </td>
    </tr>
  );
};

/**
 * Lists every channel in `client.channelManager`'s store with what keeps it (its own state and the
 * names of its holders), as reported by `channelManager.getChannelUsage()`. "Release now" calls
 * `releaseUnusedChannels()`, which the SDK never runs on its own;
 * "Stop watching" makes a channel unwatched, which list channels never are on their own.
 */
export const ChannelStoreDialog = ({
  referenceElement,
}: {
  referenceElement: HTMLElement | null;
}) => {
  const { client } = useChatContext();
  const { dialog, dialogManager } = useChannelStoreDialog();
  const dialogIsOpen = useDialogIsOpen(channelStoreDialogId, dialogManager?.id);
  const { refresh, usage } = useChannelUsage(client, dialogIsOpen);

  const closeDialog = useCallback(() => {
    dialog.close();
  }, [dialog]);

  const released = usage.filter(({ keptBy }) => !keptBy.length).length;

  return (
    <DraggableDialog
      closeOnClickOutside={false}
      closeOnEscape={false}
      dialogClassName='app__composer-inspector-dialog'
      dialogId={channelStoreDialogId}
      dialogIsOpen={dialogIsOpen}
      dialogManagerId={dialogManager?.id}
      dragHandleClassName='app__composer-inspector-dialog__drag-handle'
      // Non-modal, like the composer inspector, so the app stays usable while it is open.
      focus={false}
      onClose={closeDialog}
      promptClassName='app__composer-inspector-dialog__prompt'
      referenceElement={referenceElement}
      shellClassName='app__channel-store-dialog__shell'
      title='Channel store'
      trapFocus={false}
    >
      <Prompt.Body className='app__composer-inspector'>
        <div className='app__channel-store__toolbar'>
          <span>
            {usage.length} stored, {released} released at next release
          </span>
          <Button
            appearance='outline'
            onClick={() => {
              client.channelManager.releaseUnusedChannels();
              refresh();
            }}
            size='sm'
            variant='secondary'
          >
            Release now
          </Button>
        </div>
        {usage.length ? (
          <table className='app__channel-store__table'>
            <thead>
              <tr>
                <th>Channel</th>
                <th>Watch status</th>
                <th>Kept because</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {usage.map((entry) => (
                <ChannelUsageRow key={entry.key} onChange={refresh} usage={entry} />
              ))}
            </tbody>
          </table>
        ) : (
          <div className='app__composer-inspector__empty'>No stored channels.</div>
        )}
      </Prompt.Body>
    </DraggableDialog>
  );
};
