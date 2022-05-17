import React, { Suspense } from 'react';

import { useChatContext } from '../../context/ChatContext';

import type { ActionHandlerReturnType } from '../Message/hooks/useActionHandler';

const MMLReact = React.lazy(async () => {
  const mml = await import('mml-react');
  return { default: mml.MML };
});

export type MMLProps = {
  /** MML source string */
  source: string;
  /** Submit handler for mml actions */
  actionHandler?: ActionHandlerReturnType;
  /** Align MML components to left/right, defaults to right */
  align?: 'left' | 'right';
};

/**
 * A wrapper component around MML-React library
 */
export const MML = (props: MMLProps) => {
  const { actionHandler, align = 'right', source } = props;

  const { theme } = useChatContext('MML');

  return (
    <Suspense fallback={null}>
      <MMLReact
        className={`mml-align-${align}`}
        Loading={null}
        onSubmit={actionHandler}
        source={source}
        Success={null}
        theme={(theme || '').replace(' ', '-')}
      />
    </Suspense>
  );
};
