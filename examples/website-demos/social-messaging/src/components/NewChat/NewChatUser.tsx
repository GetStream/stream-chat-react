import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Avatar } from 'stream-chat-react';
import { UserResponse } from 'stream-chat';

import { UserType } from '../ChatContainer/ChatContainer';

import './NewChatUser.scss';

type Props = {
  user: UserResponse<UserType>;
};
export const NewChatUser: React.FC<Props> = (props) => {
  const { user } = props;

  Dayjs.extend(relativeTime)
  let status = Dayjs().from(Dayjs(user.last_active), true);

  return (
    <div className='new-chat-user'>
      <Avatar image={(user?.image as string) || ''} name={user?.name || 'User'} size={56} />
      <div className='new-chat-user-contents'>
        <div className='new-chat-user-contents-name'>
          <span>{user?.name || 'User'}</span>
        </div>
        <div className='new-chat-user-contents-status'>
          {user.last_active ? <span>Last online {status} ago</span> : <span>Not online</span>} 
        </div>
      </div>
    </div>
  );
};
