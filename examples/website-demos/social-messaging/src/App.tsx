import './styles/App.scss';

import { ChannelListContainer } from './components/ChannelList/ChannelListContainer';
import { MessageListContainer } from './components/MessageList/MessageListContainer';

function App() {
  return (
    <div className='app-container'>
     <ChannelListContainer />
     <MessageListContainer />
    </div>
  );
}

export default App;
