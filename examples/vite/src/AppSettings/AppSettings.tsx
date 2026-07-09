import { type ComponentType, useCallback, useMemo, useState } from 'react';
import {
  Button,
  ChatViewSelectorButton,
  GlobalModal,
  IconBell,
  IconEmoji,
  IconMessageBubble,
  IconMessageBubbles,
} from 'stream-chat-react';
import {
  SECTION_NAVIGATOR_LAYOUT,
  SectionNavigator,
  type SectionNavigatorLayout,
  type SectionNavigatorNavButtonProps,
  type SectionNavigatorSection,
} from 'stream-chat-react/channel-detail';

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
import clsx from 'clsx';

type TabId =
  | 'channelDetail'
  | 'general'
  | 'messageActions'
  | 'notifications'
  | 'reactions'
  | 'sidebar';

type SettingsSectionConfig = {
  Content: ComponentType<SettingsTabContentProps>;
  Icon: ComponentType;
  id: TabId;
  title: string;
};

type SettingsTabContentProps = {
  close: () => void;
};

const settingsSectionConfig: SettingsSectionConfig[] = [
  { Content: GeneralTab, Icon: IconGear, id: 'general', title: 'General' },
  {
    Content: ChannelDetailTab,
    Icon: IconMessageBubbles,
    id: 'channelDetail',
    title: 'Channel Detail',
  },
  {
    Content: MessageActionsTab,
    Icon: IconMessageBubble,
    id: 'messageActions',
    title: 'Message Actions',
  },
  {
    Content: NotificationsTab,
    Icon: IconBell,
    id: 'notifications',
    title: 'Notifications',
  },
  { Content: SidebarTab, Icon: IconSidebar, id: 'sidebar', title: 'Sidebar' },
  { Content: ReactionsTab, Icon: IconEmoji, id: 'reactions', title: 'Reactions' },
];

const createSettingsNavButton = ({
  Icon,
  id,
  title,
}: Pick<SettingsSectionConfig, 'Icon' | 'id' | 'title'>) => {
  const SettingsNavButton = ({ select, selected }: SectionNavigatorNavButtonProps) => (
    <Button
      appearance='ghost'
      aria-selected={selected}
      className={`app__settings-modal__tab ${
        selected ? 'app__settings-modal__tab--active' : ''
      }`}
      onClick={select}
      role='tab'
      size='md'
      variant='secondary'
    >
      <Icon />
      {title}
    </Button>
  );
  SettingsNavButton.displayName = `${id}SettingsNavButton`;

  return SettingsNavButton;
};

const createSettingsSectionContent = ({
  close,
  Content,
  id,
}: Pick<SettingsSectionConfig, 'Content' | 'id'> & {
  close: () => void;
}) => {
  const SettingsSectionContent = () => <Content close={close} />;
  SettingsSectionContent.displayName = `${id}SettingsSectionContent`;

  return SettingsSectionContent;
};

const createSettingsSections = (close: () => void): SectionNavigatorSection[] =>
  settingsSectionConfig.map(({ Content, Icon, id, title }) => ({
    id,
    NavButton: createSettingsNavButton({ Icon, id, title }),
    SectionContent: createSettingsSectionContent({ close, Content, id }),
  }));

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
  const [open, setOpen] = useState(false);
  const closeSettingsModal = useCallback(() => setOpen(false), []);
  const settingsSections = useMemo(
    () => createSettingsSections(closeSettingsModal),
    [closeSettingsModal],
  );
  const [layout, setLayout] = useState<SectionNavigatorLayout | undefined>();

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
      <GlobalModal onClose={closeSettingsModal} open={open}>
        <div
          className={clsx('app__settings-modal', {
            'app__settings-modal--inline': layout === SECTION_NAVIGATOR_LAYOUT.inline,
          })}
        >
          <SectionNavigator
            className='app__settings-modal__body'
            sections={settingsSections}
            onLayoutChange={setLayout}
          />
        </div>
      </GlobalModal>
    </div>
  );
};
