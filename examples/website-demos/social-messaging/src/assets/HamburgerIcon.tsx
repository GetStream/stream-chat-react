import { useViewContext } from '../contexts/ViewContext';

export const HamburgerIcon: React.FC = () => {
  const { isSideDrawerOpen, setNewChat, setSideDrawerOpen } = useViewContext();

  return (
    <svg
      width='18'
      height='16'
      viewBox='0 0 18 16'
      fill='none'
      onClick={() => {
        if (!isSideDrawerOpen) {
          setSideDrawerOpen(true);
          setNewChat(false);
        }
      }}
      style={{ cursor: 'pointer', marginLeft: '16px' }}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M0 1C0 0.447715 0.447715 0 1 0H17C17.5523 0 18 0.447715 18 1C18 1.55228 17.5523 2 17 2H1C0.447716 2 0 1.55228 0 1ZM0 8C0 7.44772 0.447715 7 1 7H17C17.5523 7 18 7.44772 18 8C18 8.55229 17.5523 9 17 9H1C0.447716 9 0 8.55229 0 8ZM0 15C0 14.4477 0.447715 14 1 14H17C17.5523 14 18 14.4477 18 15C18 15.5523 17.5523 16 17 16H1C0.447716 16 0 15.5523 0 15Z'
        fill='var(--text-high-emphasis)'
      />
    </svg>
  );
};
