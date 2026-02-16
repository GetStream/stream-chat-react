import {
  Button,
  ChatViewSelectorButton,
  GlobalModal,
  IconEmojiSmile,
  IconSettingsGear2,
} from 'stream-chat-react';
import { type ComponentType, useState } from 'react';
import { ReactionsTab } from './tabs/Reactions';

type TabId = 'reactions';

const tabConfig: { Icon: ComponentType; id: TabId; title: string }[] = [
  { Icon: IconEmojiSmile, id: 'reactions', title: 'Reactions' },
];

export const AppSettings = () => {
  const [activeTab, setActiveTab] = useState<TabId>('reactions');
  const [open, setOpen] = useState(false);

  return (
    <div className='app__settings-group'>
      <ChatViewSelectorButton
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
              id='reactions-content'
              role='tabpanel'
            >
              {activeTab === 'reactions' && <ReactionsTab />}
            </section>
          </div>
        </div>
      </GlobalModal>
    </div>
  );
};
