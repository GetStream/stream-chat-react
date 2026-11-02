import { useId, useState } from 'react';
import { convertTimestampToDate } from 'stream-chat';
import type { ChannelMemberResponse, ChannelStateData } from 'stream-chat';
import {
  Avatar,
  Prompt,
  useChatContext,
  useModalContext,
  useStateStore,
} from 'stream-chat-react';
import {
  ChannelMemberDetail,
  defaultChannelDetailSections,
  SectionNavigatorHeader,
  useChannelDetailContext,
} from 'stream-chat-react/channel-detail';
import type {
  SectionNavigatorSection,
  SectionNavigatorSectionContentProps,
} from 'stream-chat-react/channel-detail';
import './MembersWithPresence.css';

const membersSelector = ({ members }: ChannelStateData) => ({ members });

// The panel's own text is English, so its dates are too. An app in another language passes its
// language here.
const relativeTime = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

// "Last seen 5 minutes ago", in the largest unit that fits.
const formatLastSeen = (lastActive: Date) => {
  const minutes = Math.round((lastActive.getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60)
    return `Last seen ${relativeTime.format(minutes, 'minute')}`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `Last seen ${relativeTime.format(hours, 'hour')}`;
  return `Last seen ${relativeTime.format(Math.round(hours / 24), 'day')}`;
};

const getName = (member: ChannelMemberResponse) =>
  member.user?.name || member.user?.id || member.user_id || '';

type MemberRowProps = {
  isOwnUser: boolean;
  member: ChannelMemberResponse;
  onSelect: (member: ChannelMemberResponse) => void;
};

const MemberRow = ({ isOwnUser, member, onSelect }: MemberRowProps) => {
  const { user } = member;
  const name = getName(member);
  const online = !!user?.online;
  const lastActive = convertTimestampToDate(user?.last_active);
  const hintId = useId();

  // The row's text names the button, status included; the hint adds what clicking it does.
  return (
    <li>
      <button
        aria-describedby={hintId}
        className='cookbook-member-row'
        onClick={() => onSelect(member)}
        type='button'
      >
        <Avatar imageUrl={user?.image} isOnline={online} size='md' userName={name} />
        <span className='cookbook-member-row__text'>
          <span className='cookbook-member-row__name'>
            {name}
            {isOwnUser && <span className='cookbook-member-row__you'> (you)</span>}
          </span>
          {!online && lastActive && (
            <span className='cookbook-member-row__last-seen'>
              {formatLastSeen(lastActive)}
            </span>
          )}
        </span>
        <span
          className={`cookbook-member-row__status cookbook-member-row__status--${
            online ? 'online' : 'offline'
          }`}
        >
          {online ? 'Online' : 'Offline'}
        </span>
        <span hidden id={hintId}>
          Opens {name}&apos;s details
        </span>
      </button>
    </li>
  );
};

/**
 * The Members section with each member's online status: who is online first, then everyone
 * else. It reads the channel's members from `channel.state`, which the client updates when a
 * member comes online or goes offline.
 */
export const MembersWithPresence = ({ layout }: SectionNavigatorSectionContentProps) => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();
  const { close } = useModalContext();
  const { members } = useStateStore(channel.state, membersSelector);
  const [selectedMember, setSelectedMember] = useState<ChannelMemberResponse>();

  if (selectedMember) {
    return (
      <ChannelMemberDetail
        layout={layout}
        member={selectedMember}
        onBack={() => setSelectedMember(undefined)}
      />
    );
  }

  const sorted = Object.values(members).sort(
    (a, b) =>
      Number(!!b.user?.online) - Number(!!a.user?.online) ||
      getName(a).localeCompare(getName(b)),
  );
  const onlineCount = sorted.filter((member) => member.user?.online).length;

  return (
    <div className='cookbook-members-with-presence'>
      <SectionNavigatorHeader
        close={close}
        title={`${sorted.length} members · ${onlineCount} online`}
      />
      <Prompt.Body>
        <ul className='cookbook-members-with-presence__list'>
          {sorted.map((member) => (
            <MemberRow
              isOwnUser={member.user?.id === client.userId}
              key={member.user?.id ?? member.user_id}
              member={member}
              onSelect={setSelectedMember}
            />
          ))}
        </ul>
      </Prompt.Body>
    </div>
  );
};

// The default sections, with this view in place of the Members section's content.
export const sectionsWithPresence: SectionNavigatorSection[] =
  defaultChannelDetailSections.map((section) =>
    section.id === 'channel-members'
      ? { ...section, SectionContent: MembersWithPresence }
      : section,
  );
