import React from 'react';

type Props = {
  setSnackbar: React.Dispatch<React.SetStateAction<boolean>>;
};

export const CloseSnackbar: React.FC<Props> = ({ setSnackbar }) => (
  <svg
    onClick={() => setSnackbar(false)}
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    fill='none'
    viewBox='0 0 24 24'
  >
    <path
      fill='var(--text-high-emphasis)'
      fillRule='evenodd'
      d='M6.335 6.335a1.144 1.144 0 000 1.619L10.382 12l-4.047 4.046a1.144 1.144 0 101.619 1.619L12 13.619l4.046 4.046a1.145 1.145 0 001.619-1.619L13.619 12l4.046-4.046a1.145 1.145 0 00-1.619-1.619L12 10.382 7.954 6.335a1.144 1.144 0 00-1.619 0z'
      clipRule='evenodd'
    ></path>
  </svg>
);
