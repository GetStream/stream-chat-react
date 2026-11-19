import React from 'react';

import { ChannelFilesEmpty } from './ListStates';

// The deprecated name renders its new one, read when it renders, so import order cannot leave it
// undefined.

/** @deprecated Use `ChannelFilesEmpty`, which it renders. Removed in the next major. */
export const ChannelFilesEmptyList = () => <ChannelFilesEmpty />;
