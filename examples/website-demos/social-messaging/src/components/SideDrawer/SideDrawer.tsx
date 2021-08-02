import { useViewContext } from '../../contexts/ViewContext';
import './SideDrawer.scss';

export const SideDrawer: React.FC = () => {
  const { isSideDrawerOpen, setSideDrawerOpen } = useViewContext();

  return (
    <div
      className={`side-drawer ${isSideDrawerOpen ? 'isSideDrawerOpen' : ''}`}
      onClick={() => setSideDrawerOpen(!isSideDrawerOpen)}
    >
      <span>SideDrawer!!</span>
    </div>
  );
};
