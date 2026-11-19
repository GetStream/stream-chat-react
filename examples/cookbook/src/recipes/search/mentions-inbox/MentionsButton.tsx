import type { PropsWithChildren } from 'react';
import {
  Button,
  ChannelListHeader,
  useComponentContextIcons,
  WithComponents,
} from 'stream-chat-react';
import { useSidePanel } from '../../../base/SidePanel';
import { MentionsInbox } from './MentionsInbox';

const MENTIONS_PANEL_ID = 'mentions';

/** Opens and closes the mentions. */
const MentionsButton = () => {
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
    <Button
      appearance='ghost'
      aria-controls={isOpen ? 'cookbook-side-panel' : undefined}
      aria-expanded={isOpen}
      aria-label='Mentions'
      circular
      onClick={toggle}
      size='md'
      variant='secondary'
    >
      <IconBell />
    </Button>
  );
};

/** The default channel list header, with the button at its end. */
const ChannelListHeaderWithMentions = () => (
  <ChannelListHeader EndContent={MentionsButton} />
);

// Declared once, so WithComponents gets the same object on every render.
const overrides = { ChannelListHeader: ChannelListHeaderWithMentions };

/** Adds the Mentions button to the channel list header. */
export const WithMentionsButton = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
