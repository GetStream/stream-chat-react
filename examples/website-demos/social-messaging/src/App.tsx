import { ChatContainer } from './components/ChatContainer/ChatContainer';
import { ActionsProvider } from './contexts/ActionsContext';
import { ViewProvider } from './contexts/ViewContext';

import 'stream-chat-react/dist/css/index.css';
import './styles/App.scss';

function App() {
  return (
    <div className='app-container'>
      <ViewProvider>
        <ActionsProvider>
          <ChatContainer />
        </ActionsProvider>
      </ViewProvider>
    </div>
  );
}

export default App;
