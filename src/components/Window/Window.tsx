import type { PropsWithChildren } from 'react';
import React from 'react';
import clsx from 'clsx';

import type { LocalMessage } from 'stream-chat';
import { useChannelStateContext } from '../../context/ChannelStateContext';

export type WindowProps = {
  /** optional prop to force addition of class str-chat__main-panel---with-thread-opn to the Window root element */
  thread?: LocalMessage;
};

const UnMemoizedWindow = (props: PropsWithChildren<WindowProps>) => {
  // const { children, thread: propThread } = props;
  const { children } = props;

  // const { thread: contextThread } = useChannelStateContext('Window');

  return (
    <div
      className={clsx('str-chat__main-panel', {
        // 'str-chat__main-panel--thread-open': contextThread || propThread,
      })}
    >
      {children}
    </div>
  );
};

/**
 * A UI component for conditionally displaying a Thread or Channel
 */
export const Window = React.memo(UnMemoizedWindow) as typeof UnMemoizedWindow;
