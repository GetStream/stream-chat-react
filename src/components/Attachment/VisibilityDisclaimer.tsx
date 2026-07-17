import React from 'react';
import { IconEyeFill as DefaultIconEyeFill } from '../Icons';
import { useComponentContext, useTranslationContext } from '../../context';

export const VisibilityDisclaimer = () => {
  const { icons: { IconEyeFill = DefaultIconEyeFill } = {} } = useComponentContext();

  const { t } = useTranslationContext();
  return (
    <div className='str-chat__visibility-disclaimer'>
      <IconEyeFill />
      {t('Only visible to you')}
    </div>
  );
};
