import type { PropsWithChildren, ReactNode } from 'react';
import { useChatContext } from 'stream-chat-react';
import './AppLayout.css';

// A column: the banner on top, then the rest of the app. It carries `str-chat` and the theme, so
// the SDK's tokens resolve in the banner, outside ChatView.
export const AppLayout = ({
  banner,
  children,
}: PropsWithChildren<{ banner: ReactNode }>) => {
  const { theme } = useChatContext();

  return (
    <div className={`str-chat ${theme} cookbook-app-layout`}>
      {banner}
      <div className='cookbook-app-layout__body'>{children}</div>
    </div>
  );
};
