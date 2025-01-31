import React from 'react';
import { useTranslationContext } from '../../context';

export type StopAIGenerationButtonProps = React.ComponentProps<'button'>;

export const StopAIGenerationButton = ({
  onClick,
  ...restProps
}: StopAIGenerationButtonProps) => {
  const { t } = useTranslationContext();
  return (
    <button
      aria-label={t('aria/Stop AI Generation')}
      className='str-chat__stop-ai-generation-button'
      data-testid='stop-ai-generation-button'
      onClick={onClick}
      {...restProps}
    />
  );
};
