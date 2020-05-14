import React from 'react';
import { withTranslationContext } from '../../context';

let SendButton = ({ sendMessage, t }) => (
  <button className="str-chat__send-button" onClick={sendMessage}>
    <svg
      width="18"
      height="17"
      viewBox="0 0 18 17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{t('Send')}</title>
      <path
        d="M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z"
        fillRule="evenodd"
        fill="#006cff"
      />
    </svg>
  </button>
);

SendButton = withTranslationContext(SendButton);

export default React.memo(SendButton);
