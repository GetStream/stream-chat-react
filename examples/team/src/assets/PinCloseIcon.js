import React from 'react';

export const PinCloseIcon = ({ setPinsOpen }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ cursor: 'pointer', marginRight: '10px' }}
    onClick={() => setPinsOpen(false)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M27.5627 25.4416L22.121 20L27.5627 14.5583C28.1502 13.9708 28.1502 13.025 27.5627 12.4375C26.9752 11.85 26.0294 11.85 25.4419 12.4375L20.0002 17.8791L14.5585 12.4375C13.971 11.85 13.0252 11.85 12.4377 12.4375C11.8502 13.025 11.8502 13.9708 12.4377 14.5583L17.8794 20L12.4377 25.4416C11.8502 26.0291 11.8502 26.975 12.4377 27.5625C13.0252 28.15 13.971 28.15 14.5585 27.5625L20.0002 22.1208L25.4419 27.5625C26.0294 28.15 26.9752 28.15 27.5627 27.5625C28.146 26.975 28.146 26.025 27.5627 25.4416Z"
      fill="rgb(var(--primary-color))"
    />
    <rect x="0.5" y="0.5" width="39" height="39" rx="19.5" stroke="#E9E9EA" />
  </svg>
);
