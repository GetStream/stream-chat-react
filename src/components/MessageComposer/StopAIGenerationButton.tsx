import React from 'react';
import { useComponentContextIcons, useTranslationContext } from '../../context';
import { Button } from '../Button';

export type StopAIGenerationButtonProps = React.ComponentProps<'button'>;

export const StopAIGenerationButton = ({
  children,
  onClick,
  ...restProps
}: StopAIGenerationButtonProps) => {
  const { IconStopFill } = useComponentContextIcons();
  const { t } = useTranslationContext();
  return (
    <Button
      appearance='solid'
      aria-label={t(
        'messageComposer.stopAiGeneration.stopAiGeneration.ariaLabel',
        'Stop AI Generation',
      )}
      circular
      className='str-chat__stop-ai-generation-button'
      data-testid='stop-ai-generation-button'
      onClick={onClick}
      size='sm'
      variant='primary'
      {...restProps}
    >
      {children ?? <IconStopFill />}
    </Button>
  );
};
