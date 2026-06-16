import { Prompt } from 'stream-chat-react';
import { SectionNavigatorHeader } from 'stream-chat-react/channel-detail';
import { type ComponentProps } from 'react';
import clsx from 'clsx';

type SettingsTabHeaderProps = {
  close: () => void;
  description: string;
  title: string;
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
  />
);

export const SettingsTabBody = ({ className, ...props }: ComponentProps<'div'>) => (
  <Prompt.Body {...props} className={clsx('app__settings-modal__tab-body', className)} />
);
