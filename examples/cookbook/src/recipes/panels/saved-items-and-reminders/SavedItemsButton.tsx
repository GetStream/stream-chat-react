import type { PropsWithChildren } from 'react';
import {
  Button,
  ChannelListHeader,
  useComponentContextIcons,
  WithComponents,
} from 'stream-chat-react';
import { useSidePanel } from '../../../base/SidePanel';
import { SavedItems } from './SavedItems';
import './SavedItemsButton.css';

const SAVED_ITEMS_PANEL_ID = 'saved-items';

/** The default channel list header, with a button beside it that opens and closes the saved items. */
const ChannelListHeaderWithSavedItems = () => {
  const { IconBookmark } = useComponentContextIcons();
  const { closeSidePanel, openId, openSidePanel } = useSidePanel();
  const isOpen = openId === SAVED_ITEMS_PANEL_ID;

  const toggle = () =>
    isOpen
      ? closeSidePanel()
      : openSidePanel({
          body: <SavedItems />,
          id: SAVED_ITEMS_PANEL_ID,
          title: 'Saved items',
        });

  return (
    <div className='cookbook-channel-list-header'>
      <div className='cookbook-channel-list-header__title'>
        <ChannelListHeader />
      </div>
      <Button
        appearance='ghost'
        aria-controls={isOpen ? 'cookbook-side-panel' : undefined}
        aria-expanded={isOpen}
        aria-label='Saved items'
        circular
        className='cookbook-saved-items-button'
        onClick={toggle}
        size='md'
        variant='secondary'
      >
        <IconBookmark />
      </Button>
    </div>
  );
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = { ChannelListHeader: ChannelListHeaderWithSavedItems };

/** Adds the Saved items button to the channel list header. */
export const WithSavedItemsButton = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
