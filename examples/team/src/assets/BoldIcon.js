import React from 'react';

export const BoldIcon = ({ boldState, resetIconState, setBoldState }) => (
  <div
    onClick={() => {
      const bold = boldState;
      resetIconState();
      setBoldState(!bold);
    }}
  >
    <svg
      width="10"
      height="12"
      viewBox="0 0 10 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.63 5.82C8.46 5.24 9 4.38 9 3.5C9 1.57 7.43 0 5.5 0H0V12H6.25C8.04 12 9.5 10.54 9.5 8.75C9.5 7.45 8.73 6.34 7.63 5.82ZM2.5 2H5.25C6.08 2 6.75 2.67 6.75 3.5C6.75 4.33 6.08 5 5.25 5H2.5V2ZM5.75 10H2.5V7H5.75C6.58 7 7.25 7.67 7.25 8.5C7.25 9.33 6.58 10 5.75 10Z"
        fill={boldState ? 'rgb(var(--primary-color))' : 'black'}
        fillOpacity={boldState ? '1' : '0.2'}
      />
    </svg>
  </div>
);
