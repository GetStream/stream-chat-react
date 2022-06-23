import type { GlobalProvider } from '@ladle/react';
import React from 'react';

import './styles.css';

// https://ladle.dev/docs/providers
// At the moment used to provide the styles from ./styles.css to all the stories
export const Provider: GlobalProvider = ({ children }) => <>{children}</>;
