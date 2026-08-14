import React from 'react';
import { IconEyeFill } from '../Icons';
import { useTranslationContext } from '../../context';

export const VisibilityDisclaimer = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__visibility-disclaimer'>
      <IconEyeFill />
      {t('attachment.visibilityDisclaimer.onlyVisible.text', 'Only visible to you')}
    </div>
  );
};
