import './styles/App.scss';

import { ChannelListContainer } from './components/ChannelList/ChannelListContainer';
import { ChannelContainer } from './components/ChannelContainer/ChannelContainer';

import { useTheme } from './hooks/useTheme';

function App() {
  const { setMode } = useTheme(); // eslint-disable-line

  return (
    <div className='app-container'>
     <ChannelListContainer />
     <ChannelContainer />
    </div>
  );
}

export default App;
