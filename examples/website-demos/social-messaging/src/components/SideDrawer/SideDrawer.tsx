import { Avatar, useChatContext } from 'stream-chat-react';

import { NewDirectMessage, NewGroupMessage, ThemeIcon } from '../../assets';
import { useViewContext } from '../../contexts/ViewContext';

import './SideDrawer.scss';

export const SideDrawer: React.FC = () => {
  const { isSideDrawerOpen, setNewChat, setSideDrawerOpen } = useViewContext();
  const { client } = useChatContext();

  const { user } = client;

  const onClickFunction = () => {
    setSideDrawerOpen(false);
    setNewChat(true);
  };

  return (
    <div className={`side-drawer ${isSideDrawerOpen ? 'isSideDrawerOpen' : ''}`}>
      <div className='side-drawer-content-line'>
        <Avatar image={user?.image || ''} name={user?.name || user?.id} size={45} />
        <span>User</span>
      </div>
      <div className='side-drawer-content-line' onClick={() => onClickFunction()}>
        <NewDirectMessage />
        <span>New Direct Message</span>
      </div>
      <div className='side-drawer-content-line' onClick={() => onClickFunction()}>
        <NewGroupMessage />
        <span>New Group Message</span>
      </div>
      <div className='side-drawer-theme'>
        <ThemeIcon />
      </div>
    </div>
  );
};
