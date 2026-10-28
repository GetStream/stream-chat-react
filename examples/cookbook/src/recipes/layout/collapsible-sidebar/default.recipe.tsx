import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { SidebarProvider } from './SidebarContext';
import { ChannelsView, layouts, overrides, SidebarLayout } from './views';

// `?sidebar=collapsed` starts with the list collapsed, for the screenshot of that state.
const initialOpen =
  new URLSearchParams(window.location.search).get('sidebar') !== 'collapsed';

const Wrapper = ({ children }: PropsWithChildren) => (
  <SidebarProvider initialOpen={initialOpen}>
    <WithComponents overrides={overrides}>
      <SidebarLayout>{children}</SidebarLayout>
    </WithComponents>
  </SidebarProvider>
);

const recipe: RecipeConfig = {
  chatViewProps: { layouts, views: { channels: <ChannelsView /> } },
  Wrapper,
};

export default recipe;
