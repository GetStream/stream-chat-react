// First imports on purpose. The render counter installs React's DevTools hook, which React only
// picks up if it exists before react-dom loads; the performance observers must be registered before
// React or the SDK load, so nothing that happens early goes unrecorded.
import './renders';
import './observers';

import { Fragment, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { ConfigError, parseConfig } from './config';
import { installDriver } from './driver';

import 'stream-chat-react/dist/css/index.css';
import './layout.css';

const root = createRoot(document.getElementById('root')!);

// StrictMode double-invokes renders and effects, in development only. It belongs to the `dev`
// configuration and must never reach a `prod` or `profiling` number.
const Mode = import.meta.env.DEV ? StrictMode : Fragment;

try {
  const config = parseConfig(window.location.search);
  // Installed before React renders, so the runner can await __perf.ready() from the first moment.
  installDriver(config);
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
