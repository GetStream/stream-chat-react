import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import { ChannelList } from 'stream-chat-react';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { ChannelPreviewItem } from './ChannelPreviewItem';
import './Sidebar.scss';

interface SidebarProps {
  filters: ChannelFilters;
  options: ChannelOptions;
  sort: ChannelSort;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({
  filters,
  options,
  sort,
  isOpen,
  onClose,
}: SidebarProps) => {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && <div className="ai-demo-sidebar-backdrop" onClick={onClose} />}

      <div
        className={`ai-demo-sidebar ${isOpen ? 'ai-demo-sidebar--open' : ''}`}
      >
        <SidebarHeader />
        <div className="ai-demo-sidebar__list">
          <ChannelList
            setActiveChannelOnMount={false}
            Preview={ChannelPreviewItem}
            filters={filters}
            options={options}
            sort={sort}
          />
        </div>
        <SidebarFooter />
      </div>
    </>
  );
};
