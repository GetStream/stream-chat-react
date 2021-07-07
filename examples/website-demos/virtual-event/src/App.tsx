import './styles/app.scss';

import { ChatContainer } from './components/Chat/ChatContainer';
import { Navigation } from './components/Navigation/Navigation';
import { VideoContainer } from './components/Video/VideoContainer';
import { useTheme } from './hooks/useTheme';

export const App = () => {
  const { setMode, setTheme } = useTheme(); // eslint-disable-line

  return (
    <div className='app-container'>
      <Navigation />
      <VideoContainer />
      <ChatContainer />
    </div>
  );
};
