import React from 'react';

export const CodeSnippet = ({ codeState, resetIconState, setCodeState }) => (
  <div
    onClick={() => {
      const code = codeState;
      resetIconState();
      setCodeState(!code);
    }}
  >
    <svg
      width="20"
      height="12"
      viewBox="0 0 20 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.4 10.6L2.8 6L7.4 1.4L6 0L0 6L6 12L7.4 10.6ZM12.6 10.6L17.2 6L12.6 1.4L14 0L20 6L14 12L12.6 10.6Z"
        fill={codeState ? 'rgb(var(--primary-color))' : 'black'}
        fillOpacity={codeState ? '1' : '0.2'}
      />
    </svg>
  </div>
);
