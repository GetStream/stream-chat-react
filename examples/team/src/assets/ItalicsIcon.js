import React from 'react';

export const ItalicsIcon = ({
  italicState,
  resetIconState,
  setItalicState,
}) => (
  <div
    onClick={() => {
      const italic = italicState;
      resetIconState();
      setItalicState(!italic);
    }}
  >
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 0V2H6.58L2.92 10H0V12H8V10H5.42L9.08 2H12V0H4Z"
        fill={italicState ? 'rgb(var(--primary-color))' : 'black'}
        fillOpacity={italicState ? '1' : '0.2'}
      />
    </svg>
  </div>
);
