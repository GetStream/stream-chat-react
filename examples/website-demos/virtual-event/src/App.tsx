import { ChatContainer } from './components/Chat/ChatContainer';
import { Navigation } from './components/Navigation/Navigation';
import { CentralPanel } from './components/CentralPanel/CentralPanel';
import { EventProvider } from './contexts/EventContext';

export const App = () => {
  return (
    <div className='app-container'>
      <EventProvider>
        <Navigation />
        <CentralPanel />
        <ChatContainer />
      </EventProvider>
    </div>
  );
};
