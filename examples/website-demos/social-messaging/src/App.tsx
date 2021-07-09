import './styles/App.scss';

import { ChannelListContainer } from './components/ChannelList/ChannelListContainer';
import { ChannelContainer } from './components/ChannelContainer/ChannelContainer';

function App() {
  return (
    <div className='app-container'>
     <ChannelListContainer />
     <ChannelContainer />
    </div>
  );
}

export default App;
