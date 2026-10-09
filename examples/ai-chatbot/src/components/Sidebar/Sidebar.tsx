'use client';
import { ChannelLists, WithComponents } from 'stream-chat-react';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { ChannelPreviewItem } from './ChannelPreviewItem';
import './Sidebar.scss';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoOp = () => null;

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => (
  <>
    {/* Backdrop for mobile */}
    {isOpen && <div className='ai-demo-sidebar-backdrop' onClick={onClose} />}

    <div className={`ai-demo-sidebar ${isOpen ? 'ai-demo-sidebar--open' : ''}`}>
      <SidebarHeader />
      <div className='ai-demo-sidebar__list'>
        <WithComponents
          overrides={{ ChannelListItemUI: ChannelPreviewItem, EmptyListIndicator: NoOp }}
        >
          {/* Renders the conversation list `AIChatApp` registers on the channel manager. */}
          <ChannelLists />
        </WithComponents>
      </div>
      <SidebarFooter />
    </div>
  </>
);
