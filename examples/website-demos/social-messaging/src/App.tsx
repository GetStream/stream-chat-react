import 'stream-chat-react/dist/css/index.css';
import './styles/App.scss';

import { ChatContainer } from './components/ChatContainer/ChatContainer';
import { ViewProvider } from './contexts/ViewContext';

function App() {
  return (
    <div className='chat-container'>
      <ViewProvider>
        <ChatContainer />
      </ViewProvider>
    </div>
  );
}

export default App;
