import { NewDirectMessage } from '../../assets/NewDirectMessage';
import { NewGroupMessage } from '../../assets/NewGroupMessage';
import { ThemeIcon } from '../../assets/ThemeIcon';

import { useViewContext } from '../../contexts/ViewContext';

import './SideDrawer.scss';

export const SideDrawer: React.FC = () => {
  const { isSideDrawerOpen, setSideDrawerOpen } = useViewContext();

  return (
    <div
      className={`side-drawer ${isSideDrawerOpen ? 'isSideDrawerOpen' : ''}`}
      onClick={() => setSideDrawerOpen(!isSideDrawerOpen)}
    >
      <div className='side-drawer-content-line'>
        <span>User</span>
      </div>
      <div className='side-drawer-content-line'>
        <NewDirectMessage />
        <span>New Direct Message</span>
      </div>
      <div className='side-drawer-content-line'>
        <NewGroupMessage />
        <span>New Group Message</span>
      </div>
      <div className='side-drawer-theme'>
        <ThemeIcon />
      </div>
    </div>
  );
};
