import React from 'react';
import { createRoot } from 'react-dom/client';

import 'stream-chat-react/css/index.css';
import 'stream-chat-react/css/ai-components.css';
// Each renderer's stylesheet, after the package's own (OpenUI's) so it themes it.
import '@openuidev/react-ui/components.css';
import 'stream-chat-react/css/openui.css';
import 'stream-chat-react/css/a2ui.css';
import './gallery.css';

import { App } from './App';

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
