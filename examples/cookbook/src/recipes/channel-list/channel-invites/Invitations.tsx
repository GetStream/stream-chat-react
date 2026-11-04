import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { Channel, ChannelPaginator, ChannelPaginatorState } from 'stream-chat';
import {
  Button,
  ChannelAvatar,
  LoadMoreButton,
  useAriaLiveAnnouncer,
  useChannelPreviewInfo,
  useChatContext,
  useStateStore,
} from 'stream-chat-react';
import './Invitations.css';

type Answer = 'accept' | 'decline';

const invitesSelector = ({ hasMoreTail, isLoading, items }: ChannelPaginatorState) => ({
  hasMoreTail,
  isLoading,
  items,
});

/**
 * The section has nothing to show but more to load: the first page was never loaded, or the user
 * answered every loaded invitation while more remain on the server.
 */
const needsPage = (items: Channel[] | undefined, hasMoreTail: boolean) =>
  items === undefined || (items.length === 0 && hasMoreTail);

/**
 * One invitation: the channel, who invited the user, and Accept and Decline. Each button's name
 * includes the channel's name, so a screen reader tells the rows apart. While the request runs,
 * both buttons stay focusable but do nothing, and the pressed one reads "Joining…" or
 * "Declining…". Once the server answers, the row leaves the section. If the focus is in the row
 * then, it moves to the next row's first button, or else the previous row's.
 */
const Invitation = ({
  channel,
  paginator,
}: {
  channel: Channel;
  paginator: ChannelPaginator;
}) => {
  const { client } = useChatContext();
  const announce = useAriaLiveAnnouncer();
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });
  const [answering, setAnswering] = useState<Answer>();
  const rowRef = useRef<HTMLLIElement>(null);
  const inviter = channel.data?.created_by?.name;

  // Runs as the row leaves, while it is still on the page, whatever removed it.
  useLayoutEffect(() => {
    const row = rowRef.current;
    return () => {
      if (!row?.contains(document.activeElement)) return;
      const neighbour = row.nextElementSibling ?? row.previousElementSibling;
      neighbour?.querySelector('button')?.focus();
    };
  }, []);

  const answer = async (choice: Answer) => {
    if (answering) return;
    setAnswering(choice);
    try {
      if (choice === 'accept') await channel.acceptInvite();
      else await channel.rejectInvite();
      // An accepted channel joins the channel list through the `member.updated` event that
      // follows, which removes the row too if it arrives first.
      paginator.removeItem({ item: channel });
      announce(
        choice === 'accept'
          ? `Joined ${displayTitle}`
          : `Declined the invitation to ${displayTitle}`,
      );
    } catch (error) {
      setAnswering(undefined);
      client.notifications.addError({
        message: `Couldn’t answer the invitation to ${displayTitle}`,
        origin: { context: { error, panel: 'channel-list' }, emitter: 'Invitation' },
      });
    }
  };

  return (
    <li className='cookbook-invitation' ref={rowRef}>
      <ChannelAvatar
        aria-hidden='true'
        displayMembers={groupChannelDisplayInfo.members}
        imageUrl={displayImage}
        size='xl'
        userName={displayTitle}
      />
      <div className='cookbook-invitation__body'>
        <p className='cookbook-invitation__title'>{displayTitle}</p>
        {inviter && <p className='cookbook-invitation__by'>{inviter} invited you</p>}
        <div className='cookbook-invitation__actions'>
          {/* aria-disabled, not disabled: a disabled button would lose focus. */}
          <Button
            appearance='solid'
            aria-busy={answering === 'accept'}
            aria-disabled={!!answering}
            aria-label={
              answering === 'accept'
                ? `Joining ${displayTitle}…`
                : `Accept invitation to ${displayTitle}`
            }
            onClick={() => answer('accept')}
            size='sm'
            variant='primary'
          >
            {answering === 'accept' ? 'Joining…' : 'Accept'}
          </Button>
          <Button
            appearance='outline'
            aria-busy={answering === 'decline'}
            aria-disabled={!!answering}
            aria-label={
              answering === 'decline'
                ? `Declining invitation to ${displayTitle}…`
                : `Decline invitation to ${displayTitle}`
            }
            onClick={() => answer('decline')}
            size='sm'
            variant='secondary'
          >
            {answering === 'decline' ? 'Declining…' : 'Decline'}
          </Button>
        </div>
      </div>
    </li>
  );
};

/**
 * The channels the user is invited to, as a list of invitations under an "Invitations" heading.
 * Loads its first page on mount, and each further page when the user clicks "Load more", or when
 * the user answered every loaded invitation while more remain. Shows nothing until the first page
 * arrives, or when there are no invitations.
 */
export const Invitations = ({ paginator }: { paginator: ChannelPaginator }) => {
  const { hasMoreTail, isLoading, items } = useStateStore(
    paginator.state,
    invitesSelector,
  );
  const titleId = useId();

  useEffect(() => {
    if (needsPage(items, hasMoreTail)) void paginator.toTail();
  }, [hasMoreTail, items, paginator]);

  if (!items?.length) return null;

  return (
    <section aria-labelledby={titleId} className='cookbook-invitations'>
      <h2 className='cookbook-invitations__title' id={titleId}>
        Invitations
      </h2>
      <ul className='cookbook-invitations__list'>
        {items.map((channel) => (
          <Invitation channel={channel} key={channel.cid} paginator={paginator} />
        ))}
      </ul>
      {hasMoreTail && (
        <div className='cookbook-invitations__more'>
          <LoadMoreButton isLoading={isLoading} onClick={() => void paginator.toTail()} />
        </div>
      )}
    </section>
  );
};
