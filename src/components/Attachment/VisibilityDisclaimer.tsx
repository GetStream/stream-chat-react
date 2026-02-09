import React from 'react';
import { IconEyeOpen } from '../Icons';
import { useTranslationContext } from '../../context';

export const VisibilityDisclaimer = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__visibility-disclaimer'>
      <IconEyeOpen />
      {t('Only visible to you')}
    </div>
  );
};
