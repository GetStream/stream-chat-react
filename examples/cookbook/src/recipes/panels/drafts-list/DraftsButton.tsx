import { useComponentContextIcons } from 'stream-chat-react';
import {
  ChatView,
  ChatViewChannelsSelectorButton,
  ChatViewSelectorButton,
} from 'stream-chat-react/slot-layout';
import type { ChatViewSelectorEntry } from 'stream-chat-react/slot-layout';
import { useSidePanel } from '../../../base/SidePanel';
import { DraftsList } from './DraftsList';
import './DraftsButton.css';

const DRAFTS_PANEL_ID = 'drafts';

/** A button in the navigation rail that opens and closes the user's drafts in the side panel. */
const DraftsSelectorButton = () => {
  const { IconEdit } = useComponentContextIcons();
  const { closeSidePanel, openId, openSidePanel } = useSidePanel();
  const isOpen = openId === DRAFTS_PANEL_ID;

  const toggle = () =>
    isOpen
      ? closeSidePanel()
      : openSidePanel({ body: <DraftsList />, id: DRAFTS_PANEL_ID, title: 'Drafts' });

  return (
    <ChatViewSelectorButton
      aria-controls={isOpen ? 'cookbook-side-panel' : undefined}
      aria-expanded={isOpen}
      className='cookbook-drafts-button'
      Icon={IconEdit}
      onClick={toggle}
      text='Drafts'
    />
  );
};

// The channels view, then the drafts. Declared once, so the rail gets the same list every render.
const itemSet: ChatViewSelectorEntry[] = [
  { Component: ChatViewChannelsSelectorButton, type: 'channels' },
  { Component: DraftsSelectorButton, type: 'drafts' },
];

/** The navigation rail, with a Drafts button under the channels view's. */
export const NavRailWithDrafts = () => <ChatView.Selector itemSet={itemSet} />;
