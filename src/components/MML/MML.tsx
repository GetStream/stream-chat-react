import React, { useEffect, useState } from 'react';

import { useChatContext } from '../../context/ChatContext';

import type { MMLProps as MMLReactProps } from 'mml-react';

import type { ActionHandlerReturnType } from '../Message/hooks/useActionHandler';

declare global {
  interface Window {
    mmlReact: typeof import('mml-react').MML;
  }
}

const getDynamicImport = async () => {
  if (typeof window.mmlReact === 'undefined') {
    window.mmlReact = (await import('mml-react')).MML;
  }
  return window.mmlReact;
};

export type MMLProps = {
  /** MML source string */
  source: string;
  /** Submit handler for mml actions */
  actionHandler?: ActionHandlerReturnType;
  /** Align MML components to left/right, defaults to right */
  align?: 'left' | 'right';
};

/**
 * MML - A wrapper component around MML-React library
 */
export const MML: React.FC<MMLProps> = (props) => {
  const { actionHandler, align = 'right', source } = props;

  const { theme } = useChatContext();

  const [MMLState, setMMLState] = useState<{ MMLReact: React.FC<MMLReactProps> }>();

  useEffect(() => {
    const getMMLReact = async () => {
      const MMLReact = await getDynamicImport();
      setMMLState({ MMLReact });
    };

    if (source) getMMLReact();
  }, []);

  if (!MMLState || !source) return null;

  const { MMLReact } = MMLState;

  return (
    <MMLReact
      className={`mml-align-${align}`}
      Loading={null}
      onSubmit={actionHandler}
      source={source}
      Success={null}
      theme={(theme || '').replace(' ', '-')}
    />
  );
};
