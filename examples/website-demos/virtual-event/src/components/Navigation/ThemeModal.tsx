import {
  DefaultLight,
  DefaultDark,
  SocialLight,
  SocialDark,
  LivestreamLight,
  LivestreamDark,
  SupportLight,
  SupportDark,
  TeamLight,
  TeamDark,
  MusicLight,
  MusicDark,
} from '../../assets';
import { useEventContext } from '../../contexts/EventContext';
import { ModeOptions, ThemeOptions } from '../../hooks/useTheme';

type Theme = {
  mode: ModeOptions;
  option: ThemeOptions;
  icon: React.ComponentType | string;
};

const themes: Record<string, Theme> = {
  'Default Light': {
    mode: 'light',
    option: 'default',
    icon: DefaultLight,
  },
  'Default Dark': {
    mode: 'dark',
    option: 'default',
    icon: DefaultDark,
  },
  'Social Messenger Light': {
    mode: 'light',
    option: 'social',
    icon: SocialLight,
  },
  'Social Messenger Dark': {
    mode: 'dark',
    option: 'social',
    icon: SocialDark,
  },
  'Livestream Light': {
    mode: 'light',
    option: 'livestream',
    icon: LivestreamLight,
  },
  'Livestream Dark': {
    mode: 'dark',
    option: 'livestream',
    icon: LivestreamDark,
  },
  'Customer Support Light': {
    mode: 'light',
    option: 'support',
    icon: SupportLight,
  },
  'Customer Support Dark': {
    mode: 'dark',
    option: 'support',
    icon: SupportDark,
  },
  'Team Collaboration Light': {
    mode: 'light',
    option: 'team',
    icon: TeamLight,
  },
  'Team Collaboration Dark': {
    mode: 'dark',
    option: 'team',
    icon: TeamDark,
  },
  'Music Player Light': {
    mode: 'light',
    option: 'music',
    icon: MusicLight,
  },
  'Music Player Dark': {
    mode: 'dark',
    option: 'music',
    icon: MusicDark,
  },
};

export const ThemeModal = () => {
  const { setMode, setTheme } = useEventContext();

  const handleClick = (theme: Theme) => {
    setMode(theme.mode);
    setTheme(theme.option);
  };

  return (
    <div className='navigation-top-theme-modal'>
      {Object.entries(themes).map((theme, i) => {
        const Icon = theme[1].icon;

        return (
          <div
            className='navigation-top-theme-modal-item'
            key={i}
            onClick={() => handleClick(theme[1])}
          >
            <div>{theme[0]}</div>
            <Icon />
          </div>
        );
      })}
    </div>
  );
};
