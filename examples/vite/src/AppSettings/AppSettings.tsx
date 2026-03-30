import {
  Button,
  ChatViewSelectorButton,
  GlobalModal,
  IconBubble3ChatMessage,
  IconBell,
  IconEmoji,
  IconLightBulbSimple,
  IconSettingsGear2,
} from 'stream-chat-react';
import { type ComponentType, useState } from 'react';
import { ActionsMenu } from './ActionsMenu';
import { NotificationsTab } from './tabs/Notifications';
import { ReactionsTab } from './tabs/Reactions';
import { SidebarTab } from './tabs/Sidebar';
import { appSettingsStore, useAppSettingsState } from './state';

type TabId = 'notifications' | 'reactions' | 'sidebar';

const tabConfig: { Icon: ComponentType; id: TabId; title: string }[] = [
  { Icon: IconBell, id: 'notifications', title: 'Notifications' },
  { Icon: IconBubble3ChatMessage, id: 'sidebar', title: 'Sidebar' },
  { Icon: IconEmoji, id: 'reactions', title: 'Reactions' },
];

const SidebarThemeToggle = ({ iconOnly = true }: { iconOnly?: boolean }) => {
  const {
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
      Icon={IconLightBulbSimple}
      isActive={mode === 'dark'}
      onClick={() =>
        appSettingsStore.partialNext({
          theme: { mode: nextMode },
        })
      }
      role='switch'
      text={mode === 'dark' ? 'Dark mode' : 'Light mode'}
    />
  );
};

export const AppSettings = ({ iconOnly = true }: { iconOnly?: boolean }) => {
  const [activeTab, setActiveTab] = useState<TabId>('sidebar');
  const [open, setOpen] = useState(false);

  return (
    <div className='app__settings-group'>
      <ActionsMenu iconOnly={iconOnly} />
      <SidebarThemeToggle iconOnly={iconOnly} />
      <ChatViewSelectorButton
        className='app__settings-group_button'
        iconOnly={iconOnly}
        Icon={IconSettingsGear2}
        onClick={() => setOpen(true)}
        text='Settings'
      />
      <GlobalModal open={open} onClose={() => setOpen(false)}>
        <div className='app__settings-modal'>
          <header className='app__settings-modal__header'>
            <IconSettingsGear2 />
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
