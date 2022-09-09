import React from 'react';
import { createRoot } from 'react-dom/client';
// import '@stream-io/stream-chat-css/dist/css/index.css';
// import '@stream-io/stream-chat-css/dist/v2/css/index.css';
import 'stream-chat-react/dist/css/v2/index.css';
import './index.scss';
import App from './App';
import * as serviceWorker from './serviceWorker';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
