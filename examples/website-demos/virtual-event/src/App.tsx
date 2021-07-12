import { useState } from 'react';

import './styles/App.scss';

import { ChatContainer } from './components/Chat/ChatContainer';
import { Navigation } from './components/Navigation/Navigation';
import { VideoContainer } from './components/Video/VideoContainer';
import { useTheme } from './hooks/useTheme';

type TabOptions = 'overview' | 'main-event' | 'rooms';

export type TabProps = {
  selected: TabOptions;
  setSelected: React.Dispatch<React.SetStateAction<TabOptions>>;
};

export const App = () => {
  const [event, setEvent] = useState('global');
  const [selected, setSelected] = useState<TabOptions>('overview');

  const { setMode, setTheme } = useTheme(); // eslint-disable-line

  return (
    <div className='app-container'>
      <Navigation selected={selected} setSelected={setSelected} setEvent={setEvent} />
      <VideoContainer setEvent={setEvent} />
      <ChatContainer event={event} />
    </div>
  );
};
