import React from 'react';
import { useComponentContextIcons, useTranslationContext } from '../../context';

export const VisibilityDisclaimer = () => {
  const { IconEyeFill } = useComponentContextIcons();

  const { t } = useTranslationContext();
  return (
    <div className='str-chat__visibility-disclaimer'>
      <IconEyeFill />
      {t('Only visible to you')}
    </div>
  );
};
