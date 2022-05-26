import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import './styles/index.scss';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
