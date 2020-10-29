import React from 'react';

export const SmileyFace = ({ openEmojiPicker }) => (
  <div onClick={openEmojiPicker} style={{ display: 'flex' }}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        fill="#000"
        fillOpacity="0.2"
        fillRule="evenodd"
        d="M1.6 8a6.4 6.4 0 1112.8 0A6.4 6.4 0 011.6 8zM8 0a8 8 0 100 16A8 8 0 008 0zM6 7.2a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zM11.2 6a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0zM5.455 9.141a.8.8 0 10-1.31.918c.542.774 1.578 1.737 2.962 2.024 1.46.303 3.1-.184 4.688-1.948a.8.8 0 00-1.19-1.07C9.313 10.5 8.22 10.68 7.433 10.517c-.863-.18-1.586-.817-1.978-1.376z"
        clipRule="evenodd"
      ></path>
    </svg>
  </div>
);
