import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { AppLayout } from './AppLayout';
import { SimulateSystemNotification } from './SimulateSystemNotification';
import { SystemNotificationBanner } from './SystemNotificationBanner';

const Wrapper = ({ children }: PropsWithChildren) => (
  <AppLayout banner={<SystemNotificationBanner />}>
    <SimulateSystemNotification />
    {children}
  </AppLayout>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
