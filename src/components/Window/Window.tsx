import type { PropsWithChildren } from 'react';
import React from 'react';
import clsx from 'clsx';

const UnMemoizedWindow = (props: PropsWithChildren) => {
  const { children } = props;

  return <div className={clsx('str-chat__main-panel')}>{children}</div>;
};

/**
 * A UI component for conditionally displaying a Thread or Channel
 */
export const Window = React.memo(UnMemoizedWindow) as typeof UnMemoizedWindow;
