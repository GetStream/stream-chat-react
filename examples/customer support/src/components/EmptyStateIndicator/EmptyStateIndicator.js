import React from 'react';

import './EmptyStateIndicator.css';

export const EmptyStateIndicator = () => {
  return (
    <div className="empty-state__container">
      <p className="empty-state__heading">How may we assist you?</p>
      <div className="empty-state__responses">
        <div className="empty-state__response__wrapper">
          <p className="empty-state__response__text">
            I have a pricing question
          </p>
        </div>
        <div className="empty-state__response__wrapper">
          <p className="empty-state__response__text">
            I have a question about enterprise
          </p>
        </div>
        <div className="empty-state__response__wrapper">
          <p className="empty-state__response__text">
            I would like to learn more about the company
          </p>
        </div>
        <div className="empty-state__response__wrapper">
          <p className="empty-state__response__text">Other</p>
        </div>
      </div>
    </div>
  );
};
