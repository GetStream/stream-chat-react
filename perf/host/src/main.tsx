import { Fragment, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { ConfigError, parseConfig } from './config';

import 'stream-chat-react/dist/css/index.css';
import './layout.css';

const root = createRoot(document.getElementById('root')!);

// StrictMode double-invokes renders and effects, in development only. It belongs to the `dev`
// configuration and must never reach a `prod` or `profiling` number.
const Mode = import.meta.env.DEV ? StrictMode : Fragment;

try {
  const config = parseConfig(window.location.search);
  root.render(
    <Mode>
      <App config={config} />
    </Mode>,
  );
} catch (error) {
  if (!(error instanceof ConfigError)) throw error;
  root.render(
    <div className='perf-host__error' role='alert'>
      <h1>perf host: bad URL</h1>
      <p>{error.message}</p>
      <p>
        Expected:{' '}
        <code>
          ?api_key=…&amp;token=…&amp;user_id=qatest1&amp;list=standard|virtualized&amp;type=messaging|livestream
        </code>
      </p>
    </div>,
  );
}
