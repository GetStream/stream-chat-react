import { useEffect, useMemo, useRef } from 'react';
import type {
  ChannelPaginatorsOrchestrator,
  ChannelPaginatorsOrchestratorState,
  Channel as StreamChannel,
  StreamChat,
} from 'stream-chat';
import {
  Channel,
  MessageComposer,
  MessageList,
  useChatContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
  useStateStore,
  WithDragAndDropUpload,
} from 'stream-chat-react';

import { DraggableDialog } from '../AppSettings/ActionsMenu/DraggableDialog';
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '../AppSettings/SearchableSelect';
import { appSettingsStore } from '../AppSettings/state';

export const SINGLE_CHANNEL_DEFAULT_ID = 'general';
const SINGLE_CHANNEL_DIALOG_ID = 'app-single-channel-modal';

/**
 * Resolve which channel the single-channel modal should render, in priority order:
 *  1. An explicit key (`layout.channelCid` / `?channel=`): a full CID (`messaging:general`) or a
 *     bare id (assumed type `messaging`).
 *  2. Otherwise the first channel already loaded by the paginators — a real, watched channel.
 *  3. Otherwise a known demo channel.
 */
export const resolveSingleChannel = ({
  channelKey,
  client,
  orchestrator,
}: {
  channelKey?: string;
  client: StreamChat;
  orchestrator?: ChannelPaginatorsOrchestrator;
}): StreamChannel => {
  if (channelKey) {
    const separatorIndex = channelKey.indexOf(':');
    const [type, id] =
      separatorIndex === -1
        ? ['messaging', channelKey]
        : [channelKey.slice(0, separatorIndex), channelKey.slice(separatorIndex + 1)];
    return client.channel(type, id);
  }

  const loadedChannel = orchestrator?.paginators.flatMap(
    (paginator) => paginator.items ?? [],
  )[0];
  if (loadedChannel) return loadedChannel;

  return client.channel('messaging', SINGLE_CHANNEL_DEFAULT_ID);
};

const channelDisplayName = (channel: StreamChannel) =>
  (channel.data as { name?: string } | undefined)?.name ?? channel.id ?? channel.cid;

const setSingleChannel = (channelCid: string | undefined) =>
  appSettingsStore.partialNext({
    layout: { ...appSettingsStore.getLatestValue().layout, channelCid },
  });

const paginatorsSelector = (state: ChannelPaginatorsOrchestratorState) => ({
  paginators: state.paginators,
});

/**
 * The modal's title: a channel switcher. Clicking it opens the searchable selector to switch which
 * channel the single-channel modal renders (updates `layout.channelCid`; App re-resolves). Options
 * are the channels the paginators have loaded, with the current channel always present.
 */
const SingleChannelTitle = ({ channel }: { channel: StreamChannel }) => {
  const { channelPaginatorsOrchestrator } = useChatContext();
  const { paginators } = useStateStore(
    channelPaginatorsOrchestrator.state,
    paginatorsSelector,
  );

  const options = useMemo<SearchableSelectOption<string>[]>(() => {
    const loaded = Array.from(
      new Map(
        paginators.flatMap((paginator) => paginator.items ?? []).map((c) => [c.cid, c]),
      ).values(),
    ).map((c) => ({ label: channelDisplayName(c), value: c.cid }));
    return loaded.some((option) => option.value === channel.cid)
      ? loaded
      : [{ label: channelDisplayName(channel), value: channel.cid }, ...loaded];
  }, [paginators, channel]);

  return (
    <SearchableSelect
      onChange={(cid) => setSingleChannel(cid)}
      options={options}
      searchPlaceholder='Search channels'
      value={channel.cid}
    />
  );
};

/**
 * The single-channel "customer support" scenario, rendered in a floating, draggable modal (the
 * same `DraggableDialog` shell the WS-event trigger uses) over the full app — so you can see the
 * full view behind it and drag the single channel around. It's just one `<Channel>` with a message
 * list + composer (no channel list, no ChatView/slots), verifying the Channel component stands on
 * its own with only its built-in bootstrap loading/error indicators.
 *
 * There is no separate "layout mode": the modal is simply open whenever `layout.channelCid` is set
 * (App renders it then). The title switches the channel; the close button clears `channelCid`.
 * `closeOnClickOutside={false}` keeps a click on the app behind from dismissing (and re-opening)
 * the window, which would otherwise reset its dragged position.
 */
export const SingleChannelModal = ({
  channel,
  referenceElement,
}: {
  channel: StreamChannel;
  referenceElement: HTMLElement | null;
}) => {
  const { dialog, dialogManager } = useDialogOnNearestManager({
    id: SINGLE_CHANNEL_DIALOG_ID,
  });
  const dialogIsOpen = useDialogIsOpen(SINGLE_CHANNEL_DIALOG_ID, dialogManager?.id);

  // Mounted only while a channel is selected. Open the floating dialog whenever it isn't already
  // open (the `!dialogIsOpen` guard is idempotent — safe to re-run, can't loop); close on unmount
  // via a ref so it doesn't depend on the per-render `dialog` handle.
  const dialogRef = useRef(dialog);
  dialogRef.current = dialog;
  useEffect(() => {
    if (!dialogIsOpen) dialog.open();
  }, [dialog, dialogIsOpen]);
  useEffect(() => () => dialogRef.current.close(), []);

  return (
    <DraggableDialog
      closeOnClickOutside={false}
      dialogClassName='str-chat app-single-channel-modal'
      dialogId={SINGLE_CHANNEL_DIALOG_ID}
      dialogIsOpen={dialogIsOpen}
      dialogManagerId={dialogManager?.id}
      dragHandleClassName='app-single-channel-modal__drag-handle'
      // Close clears the selected channel; App then unmounts this modal.
      onClose={() => setSingleChannel(undefined)}
      promptClassName='app-single-channel-modal__prompt'
      referenceElement={referenceElement}
      shellClassName='app-single-channel-modal__shell'
      title={<SingleChannelTitle channel={channel} />}
    >
      <Channel channel={channel}>
        <WithDragAndDropUpload>
          <div className='app-single-channel-modal__body'>
            <MessageList returnAllReadData />
            <MessageComposer asyncMessagesMultiSendEnabled audioRecordingEnabled />
          </div>
        </WithDragAndDropUpload>
      </Channel>
    </DraggableDialog>
  );
};
