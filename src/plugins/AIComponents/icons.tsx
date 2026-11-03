import React from 'react';

import { createIcon } from '../../components/Icons/createIcon';

// Icons the AI components need that the SDK's icon set lacks. They follow its 20 × 20 grid
// and 1.5 stroke, and take `currentColor`.

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.5,
} as const;

export const IconAIReasoning = createIcon(
  'IconAIReasoning',
  <path
    {...stroke}
    d='M7.5 15.625H12.5M8.125 18.125H11.875M10 1.875C6.89 1.875 4.375 4.39 4.375 7.5C4.375 9.53 5.45 11.31 7.06 12.3C7.33 12.47 7.5 12.76 7.5 13.08V13.75H12.5V13.08C12.5 12.76 12.67 12.47 12.94 12.3C14.55 11.31 15.625 9.53 15.625 7.5C15.625 4.39 13.11 1.875 10 1.875Z'
  />,
);

export const IconAIShare = createIcon(
  'IconAIShare',
  <path
    {...stroke}
    d='M13.125 6.25L10 3.125M10 3.125L6.875 6.25M10 3.125V12.5M6.875 8.75H5C4.31 8.75 3.75 9.31 3.75 10V15.625C3.75 16.315 4.31 16.875 5 16.875H15C15.69 16.875 16.25 16.315 16.25 15.625V10C16.25 9.31 15.69 8.75 15 8.75H13.125'
  />,
);

const thumb =
  'M5.625 8.75V16.25M5.625 8.75H3.75C3.405 8.75 3.125 9.03 3.125 9.375V15.625C3.125 15.97 3.405 16.25 3.75 16.25H5.625M5.625 8.75L8.75 2.5C9.44 2.5 10.1 2.77 10.59 3.26C11.08 3.75 11.25 4.41 11.25 5.1V6.875H15.94C16.12 6.875 16.29 6.91 16.45 6.99C16.61 7.06 16.75 7.17 16.86 7.3C16.98 7.43 17.06 7.59 17.11 7.75C17.16 7.92 17.17 8.09 17.15 8.27L16.21 15.77C16.17 16.07 16.03 16.34 15.8 16.54C15.58 16.74 15.29 16.85 14.99 16.85H5.625'; // prettier-ignore

export const IconAIThumbsUp = createIcon(
  'IconAIThumbsUp',
  <path {...stroke} d={thumb} />,
);

export const IconAIThumbsDown = createIcon(
  'IconAIThumbsDown',
  <path {...stroke} d={thumb} transform='rotate(180 10 10)' />,
);

export const IconAIThumbsUpFill = createIcon(
  'IconAIThumbsUpFill',
  <path {...stroke} d={thumb} fill='currentColor' />,
);

export const IconAIThumbsDownFill = createIcon(
  'IconAIThumbsDownFill',
  <path {...stroke} d={thumb} fill='currentColor' transform='rotate(180 10 10)' />,
);

export const IconAIHandRaised = createIcon(
  'IconAIHandRaised',
  <path
    {...stroke}
    d='M10 5V9.375M10 5C10 4.31 10.56 3.75 11.25 3.75C11.94 3.75 12.5 4.31 12.5 5V9.375M10 5V3.75C10 3.06 9.44 2.5 8.75 2.5C8.06 2.5 7.5 3.06 7.5 3.75V5M12.5 6.25C12.5 5.56 13.06 5 13.75 5C14.44 5 15 5.56 15 6.25V11.875C15 15.03 12.84 17.5 10 17.5C7.82 17.5 6.43 16.37 5.42 14.43L3.92 11.53C3.6 10.92 3.84 10.17 4.45 9.86C5 9.58 5.67 9.73 6.04 10.23L7.5 12.19V5M7.5 5V9.375'
  />,
);

export const IconAIKey = createIcon(
  'IconAIKey',
  <path
    {...stroke}
    d='M12.5 5.625C13.19 5.625 13.75 6.185 13.75 6.875M16.875 6.875C16.875 9.635 14.635 11.875 11.875 11.875C11.37 11.875 10.88 11.8 10.42 11.66L8.75 13.125H7.5V14.375H6.25V15.625H5V16.875H3.125V14.88L8.34 9.66C8.2 9.2 8.125 8.71 8.125 8.125C8.125 4.94 10.37 1.875 13.75 2.5C15.63 2.85 16.875 4.69 16.875 6.875Z'
  />,
);

export const IconAIDevice = createIcon(
  'IconAIDevice',
  <path
    {...stroke}
    d='M8.125 15H11.875M6.25 18.125H13.75C14.44 18.125 15 17.565 15 16.875V3.125C15 2.435 14.44 1.875 13.75 1.875H6.25C5.56 1.875 5 2.435 5 3.125V16.875C5 17.565 5.56 18.125 6.25 18.125Z'
  />,
);
