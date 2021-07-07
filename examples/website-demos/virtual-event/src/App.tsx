import React from 'react';

import './styles/app.scss';

import { ChatContainer } from './components/Chat/ChatContainer';
import { Navigation } from './components/Navigation/Navigation';
import { VideoContainer } from './components/Video/VideoContainer';

export const App = () => {
  return (
    <div className='app-container'>
      <Navigation />
      <VideoContainer />
      <ChatContainer />
    </div>
  );
};
