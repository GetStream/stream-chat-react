import React from 'react';

import { useTranslationContext } from '../../context';

export const MenuIcon = ({ title }: { title?: string }) => {
  const { t } = useTranslationContext('MenuIcon');

  return (
    <svg data-testid='menu-icon' viewBox='0 0 448 512' xmlns='http://www.w3.org/2000/svg'>
      <title>{title ?? t<string>('Menu')}</title>
      <path
        d='M0 88C0 74.75 10.75 64 24 64H424C437.3 64 448 74.75 448 88C448 101.3 437.3 112 424 112H24C10.75 112 0 101.3 0 88zM0 248C0 234.7 10.75 224 24 224H424C437.3 224 448 234.7 448 248C448 261.3 437.3 272 424 272H24C10.75 272 0 261.3 0 248zM424 432H24C10.75 432 0 421.3 0 408C0 394.7 10.75 384 24 384H424C437.3 384 448 394.7 448 408C448 421.3 437.3 432 424 432z'
        fill='currentColor'
      />
    </svg>
  );
};
