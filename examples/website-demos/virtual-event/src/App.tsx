import './styles/App.scss';

import { ChatContainer } from './components/Chat/ChatContainer';
import { Navigation } from './components/Navigation/Navigation';
import { VideoContainer } from './components/Video/VideoContainer';
import { EventProvider } from './contexts/EventContext';

export const App = () => {
  return (
    <div className='app-container'>
      <EventProvider>
        <Navigation />
        <VideoContainer />
        <ChatContainer />
      </EventProvider>
    </div>
  );
};
