import { useTheme } from '../../contexts/ThemeContext';
import './SidebarFooter.scss';

export const SidebarFooter = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="ai-demo-sidebar-footer">
      <button
        className="ai-demo-sidebar-footer__theme-btn"
        onClick={toggleTheme}
        type="button"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-rounded">
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
        <span className="ai-demo-sidebar-footer__theme-text">
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </span>
      </button>
    </div>
  );
};
