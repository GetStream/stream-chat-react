import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { AppLayout } from './AppLayout';
import { ConnectionStatusBanner } from './ConnectionStatusBanner';
import { SimulateSystemNotification } from './SimulateSystemNotification';

const Wrapper = ({ children }: PropsWithChildren) => (
  <AppLayout banner={<ConnectionStatusBanner />}>
    <SimulateSystemNotification />
    {children}
  </AppLayout>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
