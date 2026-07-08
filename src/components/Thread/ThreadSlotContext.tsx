import { createContext, useContext } from 'react';

import type { SlotName } from '../ChatView/layoutController/layoutControllerTypes';

export const ThreadSlotContext = createContext<SlotName | undefined>(undefined);

export const useThreadSlotContext = () => useContext(ThreadSlotContext);
