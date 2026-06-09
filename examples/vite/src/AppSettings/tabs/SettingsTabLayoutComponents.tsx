import { Prompt } from 'stream-chat-react';
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
  <Prompt.Header
    className='app__settings-modal__tab-header'
    close={close}
    description={description}
    title={title}
  />
);

export const SettingsTabBody = ({ className, ...props }: ComponentProps<'div'>) => (
  <div {...props} className={clsx('app__settings-modal__tab-body', className)} />
);
