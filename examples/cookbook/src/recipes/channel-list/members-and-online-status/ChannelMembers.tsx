import { useChannel, useChannelMembersState, VisuallyHidden } from 'stream-chat-react';
import './ChannelMembers.css';

export const ChannelMembers = () => {
  const channel = useChannel();
  const members = useChannelMembersState(channel);

  return (
    <ul className='cookbook-channel-members'>
      {Object.values(members).map((member) => (
        <li className='cookbook-channel-members__item' key={member.user_id}>
          <span
            aria-hidden
            className={
              member.user?.online
                ? 'cookbook-channel-members__dot cookbook-channel-members__dot--online'
                : 'cookbook-channel-members__dot'
            }
          />
          {member.user?.name ?? member.user_id}
          <VisuallyHidden>
            {member.user?.online ? ', online' : ', offline'}
          </VisuallyHidden>
        </li>
      ))}
    </ul>
  );
};
