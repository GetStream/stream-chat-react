import React from 'react';
import {
  Button,
  ChatViewSelectorButton,
  GlobalModal,
  IconBell,
  IconEmoji,
  IconMessageBubble,
} from 'stream-chat-react';
import { type ComponentType, useState } from 'react';

import { ActionsMenu } from './ActionsMenu';
import { GeneralTab } from './tabs/General';
import { MessageActionsTab } from './tabs/MessageActions';
import { NotificationsTab } from './tabs/Notifications';
import { ReactionsTab } from './tabs/Reactions';
import { SidebarTab } from './tabs/Sidebar';
import { appSettingsStore, useAppSettingsState } from './state';
import { IconGear, IconLightBulb, IconSidebar, IconTextDirection } from '../icons.tsx';

type TabId = 'general' | 'messageActions' | 'notifications' | 'reactions' | 'sidebar';

const tabConfig: { Icon: ComponentType; id: TabId; title: string }[] = [
  { Icon: IconGear, id: 'general', title: 'General' },
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

  return (
    <ChatViewSelectorButton
      aria-checked={mode === 'dark'}
      aria-label={`Switch to ${nextMode} mode`}
      aria-selected={mode === 'dark'}
      className='app__settings-group_button'
      iconOnly={iconOnly}
      Icon={IconLightBulb}
      isActive={mode === 'dark'}
      onClick={() =>
        appSettingsStore.partialNext({
          theme: { ...theme, mode: nextMode },
        })
      }
      role='switch'
      style={{ color: mode === 'dark' ? '#facc15' : undefined }}
      text={mode === 'dark' ? 'Dark mode' : 'Light mode'}
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
      className='app__settings-group_button'
      iconOnly={iconOnly}
      Icon={IconTextDirection}
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
      <ActionsMenu iconOnly={iconOnly} />
      <SidebarThemeToggle iconOnly={iconOnly} />
      <SidebarRtlToggle iconOnly={iconOnly} />
      <ChatViewSelectorButton
        className='app__settings-group_button'
        iconOnly={iconOnly}
        Icon={IconGear}
        onClick={() => setOpen(true)}
        text='Settings'
      />
      <GlobalModal open={open} onClose={() => setOpen(false)}>
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
