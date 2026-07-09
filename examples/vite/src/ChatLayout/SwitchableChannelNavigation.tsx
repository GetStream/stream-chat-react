import { useEffect, useMemo, useState } from 'react';
import type {
  ChannelPaginator,
  ChannelPaginatorsOrchestratorState,
  ChannelPaginatorState,
  SearchControllerState,
} from 'stream-chat';
import {
  Button,
  ChannelList,
  ChannelListContextProvider,
  ChannelListHeader,
  ContextMenu,
  ContextMenuButton,
  NotificationList as DefaultNotificationList,
  Search as DefaultSearch,
  IconChevronDown,
  useChatContext,
  useComponentContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
  useStateStore,
} from 'stream-chat-react';

// Human-readable labels for each channel list, keyed by the paginator id set up in App.tsx.
// The SDK doesn't name lists — an app that shows more than one decides how to label them, so
// this map lives here in the example rather than in the SDK.
const CHANNEL_LIST_LABELS: Record<string, string> = {
  'channels:default': 'My channels',
  'channels:archived': 'Archived',
  'channels:muted': 'Muted',
  'channels:opened': 'Opened',
};
const labelFor = (id: string) => CHANNEL_LIST_LABELS[id] ?? id;

// The catch-all fallback: shown in the switcher menu only once it actually holds a channel.
const FALLBACK_PAGINATOR_ID = 'channels:opened';

const SWITCHER_DIALOG_ID = 'app-channel-list-switcher';

const itemCountSelector = (state: ChannelPaginatorState) => ({
  count: state.items?.length ?? 0,
});

const paginatorsSelector = (state: ChannelPaginatorsOrchestratorState) => ({
  paginators: state.paginators,
});
const searchControllerStateSelector = (state: SearchControllerState) => ({
  isActive: state.isActive,
});

// One menu entry per channel list. Subscribes to its paginator's state so the fallback can
// appear/disappear reactively as it gains/loses channels (the parent only re-renders when the
// set of paginators changes, not when a paginator's items do).
const ChannelListMenuItem = ({
  activeId,
  onPick,
  paginator,
}: {
  activeId: string;
  onPick: (id: string) => void;
  paginator: ChannelPaginator;
}) => {
  const { count } = useStateStore(paginator.state, itemCountSelector);

  if (paginator.id === FALLBACK_PAGINATOR_ID && count === 0) return null;

  return (
    <ContextMenuButton
      aria-checked={paginator.id === activeId}
      onClick={() => onPick(paginator.id)}
      role='menuitemradio'
    >
      {labelFor(paginator.id)}
    </ContextMenuButton>
  );
};

// Menu to switch between channel lists, built on the SDK's `ContextMenu` (anchored-dialog mode):
// a trigger button is the reference element and the menu opens into the nearest DialogManager —
// the same primitive the SDK uses for message/channel action menus, so it gets roving focus,
// Escape/outside-click dismissal, and placement for free. Renders nothing when there's only one
// list (nothing to switch to).
const ChannelListSwitcher = ({
  activeId,
  onSelect,
  paginators,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  paginators: ChannelPaginator[];
}) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: SWITCHER_DIALOG_ID });
  const dialogIsOpen = useDialogIsOpen(SWITCHER_DIALOG_ID, dialogManager?.id);

  // Publish the trigger's width as a CSS var so the portalled ContextMenu can match it (the menu
  // isn't a DOM descendant of the trigger, so it can't inherit the width; a root-level var can).
  useEffect(() => {
    if (!referenceElement) return;
    const syncWidth = () =>
      document.documentElement.style.setProperty(
        '--app-channel-list-switcher-menu-width',
        `${referenceElement.offsetWidth}px`,
      );
    syncWidth();
    const observer = new ResizeObserver(syncWidth);
    observer.observe(referenceElement);
    return () => observer.disconnect();
  }, [referenceElement]);

  if (paginators.length < 2) return null;

  return (
    <div className='app-channel-list-switcher'>
      <Button
        appearance='ghost'
        aria-expanded={dialogIsOpen}
        aria-haspopup='menu'
        className='app-channel-list-switcher__trigger'
        onClick={() => dialog.toggle()}
        ref={setReferenceElement}
        size='sm'
        variant='secondary'
      >
        <span className='app-channel-list-switcher__label'>{labelFor(activeId)}</span>
        <span aria-hidden className='app-channel-list-switcher__caret'>
          <IconChevronDown />
        </span>
      </Button>
      <ContextMenu
        aria-label='Switch channel list'
        className='app-channel-list-switcher__menu'
        dialogManagerId={dialogManager?.id}
        id={dialog.id}
        onClose={() => dialog.close()}
        placement='bottom-end'
        referenceElement={referenceElement}
        trapFocus
      >
        {paginators.map((paginator) => (
          <ChannelListMenuItem
            activeId={activeId}
            key={paginator.id}
            onPick={(id) => {
              onSelect(id);
              dialog.close();
            }}
            paginator={paginator}
          />
        ))}
      </ContextMenu>
    </div>
  );
};

/**
 * Example channel navigation that shows exactly ONE channel list at a time plus a menu to
 * switch between the lists held by the `ChannelPaginatorsOrchestrator`. It mirrors the SDK's
 * `ChannelNavigation` (header, search, notifications) but replaces the SDK's stacked
 * `ChannelLists` (one `<ChannelList>` per paginator, empty ones included) with a switcher +
 * the active list. This keeps the empty "Opened" fallback from rendering below the primary
 * list until the user actually switches to it.
 */
export const SwitchableChannelNavigation = () => {
  const { NotificationList = DefaultNotificationList, Search = DefaultSearch } =
    useComponentContext();
  const { channelPaginatorsOrchestrator, searchController } = useChatContext();
  const { paginators } = useStateStore(
    channelPaginatorsOrchestrator.state,
    paginatorsSelector,
  );
  const { isActive } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  // Default to the first list; if the selected list disappears (or none is selected yet),
  // fall back to the first available paginator.
  const activePaginator = useMemo(
    () => paginators.find((paginator) => paginator.id === activeId) ?? paginators[0],
    [paginators, activeId],
  );

  return (
    <div className='str-chat__channel-list'>
      <ChannelListHeader />
      <Search />
      {!isActive && activePaginator && (
        // Expose the active paginator through ChannelListContext (as the SDK's ChannelLists
        // does with its primary) so notification targeting resolves the 'channel-list' panel.
        <ChannelListContextProvider value={{ paginator: activePaginator }}>
          <ChannelListSwitcher
            activeId={activePaginator.id}
            onSelect={setActiveId}
            paginators={paginators}
          />
          <ChannelList key={activePaginator.id} paginator={activePaginator} />
        </ChannelListContextProvider>
      )}
      <NotificationList panel='channel-list' />
    </div>
  );
};
