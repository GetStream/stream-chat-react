import React from 'react';

import './HomePage.scss';

export const HomePage = () => {
  return (
    <div className='homepage-container'>
      <div className='homepage-header'>HEADER</div>
      <div className='homepage-tabs'>
        <ul>
          <li>Description</li>
          <li>Partners</li>
          <li>Schedule</li>
          <li>Speakers</li>
        </ul>
      </div>
      <div className='homepage-title'>TITLE</div>
      <div className='homepage-title-date'>DATE</div>
      <div className='homepage-content'>CONTENT</div>
      <div className='homepage-content-stats'>STATS</div>
      <div className='homepage-partners'>PARTNERS</div>
      <div className='homepage-schedule'>SCHEDULE</div>
    </div>
  );
};
