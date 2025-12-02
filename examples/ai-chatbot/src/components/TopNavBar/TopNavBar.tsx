import { useChannelStateContext } from 'stream-chat-react';
import { useTheme } from '../../contexts/ThemeContext';
import './TopNavBar.scss';

interface TopNavBarProps {
  onToggleSidebar: () => void;
}

export const TopNavBar = ({ onToggleSidebar }: TopNavBarProps) => {
  const { channel } = useChannelStateContext();
  const { theme, toggleTheme } = useTheme();

  const conversationTitle = channel?.data?.summary ?? channel?.id ?? 'New Chat';

  return (
    <div className="ai-demo-top-nav">
      <button
        className="ai-demo-top-nav__menu-btn"
        onClick={onToggleSidebar}
        type="button"
        aria-label="Toggle sidebar"
      >
        <span className="material-symbols-rounded">menu</span>
      </button>

      <h1 className="ai-demo-top-nav__title">{conversationTitle}</h1>

      <button
        className="ai-demo-top-nav__theme-btn"
        onClick={toggleTheme}
        type="button"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-rounded">
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
    </div>
  );
};
