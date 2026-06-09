import React, { type ComponentType, useState } from 'react';
import {
  Button,
  ChatViewSelectorButton,
  GlobalModal,
  IconBell,
  IconEmoji,
  IconMessageBubble,
  IconMessageBubbles,
} from 'stream-chat-react';

import { ActionsMenu } from './ActionsMenu';
import { ChannelDetailTab } from './tabs/ChannelDetail';
import { GeneralTab } from './tabs/General';
import { MessageActionsTab } from './tabs/MessageActions';
import { NotificationsTab } from './tabs/Notifications';
import { ReactionsTab } from './tabs/Reactions';
import { SidebarTab } from './tabs/Sidebar';
import { appSettingsStore, useAppSettingsState } from './state';
import {
  IconGear,
  IconMoon,
  IconSidebar,
  IconSun,
  IconTextDirection,
} from '../icons.tsx';

type TabId =
  | 'channelDetail'
  | 'general'
  | 'messageActions'
  | 'notifications'
  | 'reactions'
  | 'sidebar';

const tabConfig: { Icon: ComponentType; id: TabId; title: string }[] = [
  { Icon: IconGear, id: 'general', title: 'General' },
  { Icon: IconMessageBubbles, id: 'channelDetail', title: 'Channel Detail' },
  { Icon: IconMessageBubble, id: 'messageActions', title: 'Message Actions' },
  { Icon: IconBell, id: 'notifications', title: 'Notifications' },
  { Icon: IconSidebar, id: 'sidebar', title: 'Sidebar' },
  { Icon: IconEmoji, id: 'reactions', title: 'Reactions' },
];

const SidebarThemeToggle = ({ iconOnly = true }: { iconOnly?: boolean }) => {
  const {
    theme,
    theme: { mode },
  } = useAppSettingsState();
  const nextMode = mode === 'dark' ? 'light' : 'dark';
  const Icon = mode === 'dark' ? IconSun : IconMoon;
  return (
    <ChatViewSelectorButton
      aria-checked={mode === 'dark'}
      aria-label={`Switch to ${nextMode} mode`}
      aria-selected={mode === 'dark'}
      className='app__settings-group_button app__settings-group_button--toggle'
      Icon={Icon}
      iconOnly={iconOnly}
      isActive={mode === 'dark'}
      onClick={() =>
        appSettingsStore.partialNext({
          theme: { ...theme, mode: nextMode },
        })
      }
      role='switch'
      text={mode === 'dark' ? 'Light mode' : 'Dark mode'}
    />
  );
};

const SidebarRtlToggle = ({ iconOnly = true }: { iconOnly?: boolean }) => {
  const {
    theme,
    theme: { direction },
  } = useAppSettingsState();
  const isRtl = direction === 'rtl';

  return (
    <ChatViewSelectorButton
      aria-checked={isRtl}
      aria-label={`Switch to ${isRtl ? 'LTR' : 'RTL'} direction`}
      aria-selected={isRtl}
      className='app__settings-group_button app__settings-group_button--toggle'
      Icon={IconTextDirection}
      iconOnly={iconOnly}
      isActive={isRtl}
      onClick={() =>
        appSettingsStore.partialNext({
          theme: { ...theme, direction: isRtl ? 'ltr' : 'rtl' },
        })
      }
      role='switch'
      text={isRtl ? 'RTL' : 'LTR'}
    />
  );
};

export const AppSettings = ({ iconOnly = true }: { iconOnly?: boolean }) => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [open, setOpen] = useState(false);

  return (
    <div className='app__settings-group'>
      <SidebarRtlToggle iconOnly={iconOnly} />
      <SidebarThemeToggle iconOnly={iconOnly} />
      <ActionsMenu iconOnly={iconOnly} />
      <ChatViewSelectorButton
        className='app__settings-group_button'
        Icon={IconGear}
        iconOnly={iconOnly}
        onClick={() => setOpen(true)}
        text='Settings'
      />
      <GlobalModal onClose={() => setOpen(false)} open={open}>
        <div className='app__settings-modal'>
          <header className='app__settings-modal__header'>
            <IconGear />
            Settings
          </header>
          <div className='app__settings-modal__body'>
            <nav
              aria-label='Settings sections'
              className='app__settings-modal__tabs'
              role='tablist'
            >
              {tabConfig.map(({ Icon, id, title }) => (
                <Button
                  aria-controls={`${id}-content`}
                  aria-selected={activeTab === id}
                  className={`app__settings-modal__tab str-chat__button--ghost str-chat__button--secondary str-chat__button--size-lg ${
                    activeTab === id ? 'app__settings-modal__tab--active' : ''
                  }`}
                  key={id}
                  onClick={() => setActiveTab(id)}
                  role='tab'
                >
                  <Icon />
                  {title}
                </Button>
              ))}
            </nav>
            <section
              className='app__settings-modal__content'
              id={`${activeTab}-content`}
              role='tabpanel'
            >
              {activeTab === 'channelDetail' && <ChannelDetailTab />}
              {activeTab === 'general' && <GeneralTab />}
              {activeTab === 'messageActions' && <MessageActionsTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'sidebar' && <SidebarTab />}
              {activeTab === 'reactions' && <ReactionsTab />}
            </section>
          </div>
        </div>
      </GlobalModal>
    </div>
  );
};
