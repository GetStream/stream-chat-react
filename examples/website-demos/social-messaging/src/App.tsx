import { ChatContainer } from './components/ChatContainer/ChatContainer';
import { ActionsProvider } from './contexts/ActionsContext';
import { UnreadProvider } from './contexts/UnreadContext';
import { ViewProvider } from './contexts/ViewContext';

import 'stream-chat-react/dist/css/index.css';
import './styles/App.scss';

function App() {
  return (
    <div className='app-container'>
      <ViewProvider>
        <UnreadProvider>
          <ActionsProvider>
            <ChatContainer />
          </ActionsProvider>
        </UnreadProvider>
      </ViewProvider>
    </div>
  );
}

export default App;
