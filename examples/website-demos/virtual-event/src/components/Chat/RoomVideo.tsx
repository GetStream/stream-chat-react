import React from 'react';

import { ConnectionStatus, Listening, Muted, Speaking } from '../../assets';

// import part1 from '../../assets/participant01.jpg';

export const RoomVideo = () => {
  return (
    <div className='room-video-container'>
      <div className='room-video-header'>Data strategy and executive communication</div>
      <div className='room-video-grid'>
        <div
          className='room-video-grid-participant'
          style={{ backgroundImage: `url(${'../../assets/participant01.jpg'})` }}
        >
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Lita Sherman</div>
            <Speaking />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
        <div className='room-video-grid-participant'>
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Kirk Purdie</div>
            <Listening />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
        <div className='room-video-grid-participant'>
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Khalid Ignác</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
        <div className='room-video-grid-participant'>
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Jaana Kirstie</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
        <div className='room-video-grid-participant'>
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Neal Sameera</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
        <div className='room-video-grid-participant'>
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Halide Nursultan</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
      </div>
    </div>
  );
};
