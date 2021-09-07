import { ChatContainer } from './components/ChatContainer/ChatContainer';
import { ViewProvider } from './contexts/ViewContext';

import 'stream-chat-react/dist/css/index.css';
import './styles/App.scss';

function App() {
  return (
    <div className='app-container'>
      <ViewProvider>
        <ChatContainer />
      </ViewProvider>
    </div>
  );
}

export default App;
