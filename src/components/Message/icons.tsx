import React from 'react';

import type { PinIndicatorProps } from './types';

import type { IconProps } from '../../types/types';

export const ActionsIcon = ({ className = '' }: IconProps) => (
  <svg
    className={className}
    height='4'
    viewBox='0 0 11 4'
    width='11'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z'
      fillRule='nonzero'
    />
  </svg>
);

export const ReactionIcon = ({ className = '' }: IconProps) => (
  <svg
    className={className}
    height='12'
    viewBox='0 0 12 12'
    width='12'
    xmlns='http://www.w3.org/2000/svg'
  >
    <g clipRule='evenodd' fillRule='evenodd'>
      <path d='M6 1.2C3.3 1.2 1.2 3.3 1.2 6c0 2.7 2.1 4.8 4.8 4.8 2.7 0 4.8-2.1 4.8-4.8 0-2.7-2.1-4.8-4.8-4.8zM0 6c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6z' />
      <path d='M5.4 4.5c0 .5-.4.9-.9.9s-.9-.4-.9-.9.4-.9.9-.9.9.4.9.9zM8.4 4.5c0 .5-.4.9-.9.9s-.9-.4-.9-.9.4-.9.9-.9.9.4.9.9zM3.3 6.7c.3-.2.6-.1.8.1.3.4.8.9 1.5 1 .6.2 1.4.1 2.4-1 .2-.2.6-.3.8 0 .2.2.3.6 0 .8-1.1 1.3-2.4 1.7-3.5 1.5-1-.2-1.8-.9-2.2-1.5-.2-.3-.1-.7.2-.9z' />
    </g>
  </svg>
);

export const ThreadIcon = ({ className = '' }: IconProps) => (
  <svg className={className} height='10' width='14' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z'
      fillRule='evenodd'
    />
  </svg>
);

export const PinIcon = () => (
  <svg height='13' viewBox='0 0 14 13' width='14' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M13.3518 6.686L6.75251 0.0866699L5.80984 1.02867L6.75318 1.972V1.97334L3.45318 5.272L3.45251 5.27334L2.50984 4.32934L1.56718 5.27267L4.39584 8.10067L0.624512 11.8713L1.56718 12.814L5.33851 9.04334L8.16718 11.8713L9.10984 10.9293L8.16718 9.986L11.4672 6.686L12.4098 7.62867L13.3518 6.686ZM7.22451 9.04267L7.22385 9.04334L4.39584 6.21467L7.69518 2.91467L10.5232 5.74267L7.22451 9.04267Z'
      fillRule='evenodd'
    />
  </svg>
);

export const PinIndicator = ({ message, t }: PinIndicatorProps) => {
  if (!message || !t) return null;

  return (
    <div style={{ alignItems: 'center', display: 'flex' }}>
      <PinIcon />
      <div
        style={{
          fontSize: '14px',
          marginBottom: '0',
          marginLeft: '8px',
          marginTop: '0',
        }}
      >
        {message.pinned_by
          ? `${t('Pinned by')} ${message.pinned_by?.name || message.pinned_by?.id}`
          : t('Message pinned')}
      </div>
    </div>
  );
};

export const MessageSentIcon = () => (
  <svg
    data-testid='message-sent-icon'
    fill='currentColor'
    viewBox='0 0 10 8'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      clipRule='evenodd'
      d='M9.47116 1.80482C9.73151 1.54447 9.73151 1.12236 9.47116 0.862011C9.21081 0.601661 8.7887 0.601661 8.52835 0.862011L3.66646 5.7239L1.47108 3.52851C1.21073 3.26816 0.788619 3.26816 0.52827 3.52851C0.26792 3.78886 0.26792 4.21097 0.52827 4.47132L3.18877 7.13182C3.19083 7.13394 3.19292 7.13605 3.19502 7.13815C3.45537 7.3985 3.87748 7.3985 4.13783 7.13815L9.47116 1.80482Z'
      fillRule='evenodd'
    />
  </svg>
);

export const MessageDeliveredIcon = () => (
  <svg
    data-testid='delivered-icon'
    fill='currentColor'
    viewBox='0 0 14 8'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      clipRule='evenodd'
      d='M9.50041 0.862011C9.76149 1.12236 9.76149 1.54447 9.50041 1.80482L6.63046 4.66681L7.69051 5.72392L12.566 0.862011C12.827 0.601661 13.2503 0.601661 13.5114 0.862011C13.7725 1.12236 13.7725 1.54447 13.5114 1.80482L8.16321 7.13815C7.90214 7.3985 7.47885 7.3985 7.21778 7.13815C7.2164 7.13678 7.21502 7.13539 7.21366 7.13401L5.68502 5.60962L4.15223 7.13815C3.89115 7.3985 3.46787 7.3985 3.20679 7.13815L3.19746 7.12866L0.53272 4.47132C0.271645 4.21097 0.271645 3.78886 0.53272 3.52851C0.793794 3.26816 1.21708 3.26816 1.47815 3.52851L3.6796 5.72385L5.20067 4.207L5.21216 4.19526L5.22393 4.1838L8.55498 0.862011C8.81605 0.601661 9.23934 0.601661 9.50041 0.862011Z'
      // fill='#005DFF'
      fillRule='evenodd'
    />
  </svg>
);

export const MessageErrorIcon = () => (
  <div className='str-chat__message-error-icon'>
    <svg
      data-testid='error'
      fill='none'
      height='24'
      viewBox='0 0 24 24'
      width='24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z'
        fill='black'
        id='background'
      />
      <path d='M13 17H11V15H13V17ZM13 13H11V7H13V13Z' fill='white' />
    </svg>
  </div>
);
