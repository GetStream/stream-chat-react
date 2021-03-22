import React from 'react';
import { MML as MMLReact } from 'mml-react';

import { useChatContext } from '../../context/ChatContext';

import type { ActionHandlerReturnType } from '../Message/hooks/useActionHandler';

export type MMLProps = {
  /** mml source string */
  source: string;
  /** submit handler for mml actions */
  actionHandler?: ActionHandlerReturnType;
  /** align mml components to left/right
   * @default right
   */
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
