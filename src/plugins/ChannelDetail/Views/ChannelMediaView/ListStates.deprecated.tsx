import React from 'react';

import { ChannelMediaEmpty } from './ListStates';

// The deprecated name renders its new one, read when it renders, so import order cannot leave it
// undefined.

/** @deprecated Use `ChannelMediaEmpty`, which it renders. Removed in the next major. */
export const ChannelMediaEmptyList = () => <ChannelMediaEmpty />;
