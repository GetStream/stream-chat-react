import React from 'react';

export const PinCloseIcon = ({ closeThread, setPinsOpen }) => (
  <button
    onClick={(e) => {
      closeThread(e);
      setPinsOpen(false);
    }}
    class="str-chat__square-button pinned-messages__close"
  >
    <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z"
        fill-rule="evenodd"
      ></path>
    </svg>
  </button>
);
