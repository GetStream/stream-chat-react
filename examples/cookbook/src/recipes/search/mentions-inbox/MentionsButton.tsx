import type { PropsWithChildren } from 'react';
import {
  Button,
  ChannelListHeader,
  useComponentContextIcons,
  WithComponents,
} from 'stream-chat-react';
import { useSidePanel } from '../../../base/SidePanel';
import { MentionsInbox } from './MentionsInbox';
import './MentionsButton.css';

const MENTIONS_PANEL_ID = 'mentions';

/** The default channel list header, with a button beside it that opens and closes the mentions. */
const ChannelListHeaderWithMentions = () => {
  const { IconBell } = useComponentContextIcons();
  const { closeSidePanel, openId, openSidePanel } = useSidePanel();
  const isOpen = openId === MENTIONS_PANEL_ID;

  const toggle = () =>
    isOpen
      ? closeSidePanel()
      : openSidePanel({
          body: <MentionsInbox />,
          id: MENTIONS_PANEL_ID,
          title: 'Mentions',
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
        aria-label='Mentions'
        circular
        className='cookbook-mentions-button'
        onClick={toggle}
        size='md'
        variant='secondary'
      >
        <IconBell />
      </Button>
    </div>
  );
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = { ChannelListHeader: ChannelListHeaderWithMentions };

/** Adds the Mentions button to the channel list header. */
export const WithMentionsButton = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
