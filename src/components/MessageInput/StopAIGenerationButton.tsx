import React from 'react';

export type StopAIGenerationButtonProps = React.ComponentProps<'button'>;

export const StopAIGenerationButton = ({ onClick, ...restProps }: StopAIGenerationButtonProps) => (
  <button
    aria-label='aria/Stop'
    className='str-chat__stop-generating-button'
    data-testid='stop-ai-generation-button'
    onClick={onClick}
    {...restProps}
  />
);
