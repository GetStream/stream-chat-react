import { Button, Prompt } from 'stream-chat-react';
import { SectionNavigatorHeader } from 'stream-chat-react/channel-detail';
import { type ComponentProps } from 'react';
import clsx from 'clsx';
import { IconCollapse, IconExpand } from '../../icons';
import { useFullscreen } from '../fullscreen';

type SettingsTabHeaderProps = {
  close: () => void;
  description: string;
  title: string;
};

/**
 * Sits next to the close button, in the header's trailing slot. Rendered here rather than in
 * `AppSettings` so it lands inside the existing header layout instead of being positioned over it — and
 * because this is the one component every tab already shares.
 */
const FullscreenToggle = () => {
  const state = useFullscreen();

  if (!state) return null;

  const { fullscreen, toggleFullscreen } = state;
  const label = fullscreen ? 'Exit full screen' : 'Expand to full screen';

  return (
    <Button
      appearance='ghost'
      aria-label={label}
      aria-pressed={fullscreen}
      className='app__settings-modal__fullscreen-button'
      onClick={toggleFullscreen}
      size='sm'
      title={label}
      variant='secondary'
    >
      {fullscreen ? <IconCollapse /> : <IconExpand />}
    </Button>
  );
};

export const SettingsTabLayoutHeader = ({
  close,
  description,
  title,
}: SettingsTabHeaderProps) => (
  <SectionNavigatorHeader
    className='app__settings-modal__tab-header'
    close={close}
    description={description}
    title={title}
    TrailingContent={FullscreenToggle}
  />
);

export const SettingsTabBody = ({ className, ...props }: ComponentProps<'div'>) => (
  <Prompt.Body {...props} className={clsx('app__settings-modal__tab-body', className)} />
);

/**
 * Actions that must stay reachable while the body scrolls.
 *
 * A sibling of the body rather than the last thing inside it: the body is the scroll container, so
 * anything in it scrolls away. The Configuration tab is long enough that Apply sat several screens below
 * the editor it applies.
 */
export const SettingsTabFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <Prompt.Footer
    {...props}
    className={clsx('app__settings-modal__tab-footer', className)}
  />
);
