import React from 'react';
import { createRoot } from 'react-dom/client';

import 'stream-chat-react/css/index.css';
import '@openuidev/react-ui/components.css';
import 'stream-chat-react/css/ai-components.css';
import './gallery.css';

import { App } from './App';

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
