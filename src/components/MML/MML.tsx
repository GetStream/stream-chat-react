import React from 'react';
import { MML as MMLReact } from 'mml-react';

import { useChatContext } from '../../context/ChatContext';

import type { ActionHandlerReturnType } from '../Message/hooks/useActionHandler';

export type MMLProps = {
  /** MML source string */
  source: string;
  /** Handler function for MML actions */
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

  if (!source) return null;

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
