import clsx from 'clsx';
import { type CSSProperties } from 'react';
import { LoadingChannel, LoadingChannels } from 'stream-chat-react';

// This component renders before the chat client is created. ChatView depends on ChatContext
// provided by <Chat>, so using ChatView here would run outside its provider and produce
// incomplete behavior/warnings. We intentionally mirror ChatView structure/classes to keep
// loading dimensions aligned with the final loaded layout.
// Update this layout every time layout in App.tsx is updated.
type LoadingScreenProps = {
  initialAppLayoutStyle: CSSProperties;
  initialNavOpen: boolean;
  initialThreadOpen: boolean;
};

const selectorButtonCount = 4;

export const LoadingScreen = ({
  initialAppLayoutStyle,
  initialNavOpen,
  initialThreadOpen,
}: LoadingScreenProps) => (
  <div className='app-chat-layout' style={initialAppLayoutStyle}>
    <div className='str-chat'>
      <div className='str-chat__chat-view'>
        <div
          className={clsx('str-chat__chat-view__selector', {
            'str-chat__chat-view__selector--nav-closed': !initialNavOpen,
            'str-chat__chat-view__selector--nav-open': initialNavOpen,
          })}
        >
          {Array.from({ length: selectorButtonCount }).map((_, index) => (
            <div className='str-chat__chat-view__selector-button-container' key={index}>
              <div className='str-chat__chat-view__selector-button'>
                <span className='str-chat__loading-channels-avatar' />
              </div>
            </div>
          ))}
        </div>
        <div className='str-chat__chat-view__channels'>
          <div
            className={clsx('app-chat-view__channels-layout', {
              'app-chat-view__channels-layout--sidebar-collapsed': !initialNavOpen,
            })}
          >
            <div className='str-chat__channel-list'>
              <LoadingChannels />
            </div>
            <div
              aria-orientation='vertical'
              className='app-chat-resize-handle'
              role='separator'
            >
              <div className='app-chat-resize-handle__hitbox'>
                <div className='app-chat-resize-handle__line' />
              </div>
            </div>
            <div className='str-chat__channel'>
              <div className='str-chat__container'>
                <div className='str-chat__main-panel'>
                  <div className='str-chat__main-panel-inner'>
                    <div className='str-chat__window'>
                      <LoadingChannel />
                    </div>
                  </div>
                </div>
                <div
                  aria-orientation='vertical'
                  className={clsx(
                    'app-chat-resize-handle app-chat-resize-handle--thread',
                    {
                      'app-chat-resize-handle--thread-hidden': !initialThreadOpen,
                    },
                  )}
                  role='separator'
                >
                  <div className='app-chat-resize-handle__hitbox'>
                    <div className='app-chat-resize-handle__line' />
                  </div>
                </div>
                <div
                  className={clsx(
                    'str-chat__dropzone-root--thread app-chat-thread-panel',
                    {
                      'app-chat-thread-panel--open': initialThreadOpen,
                    },
                  )}
                >
                  <LoadingChannel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
