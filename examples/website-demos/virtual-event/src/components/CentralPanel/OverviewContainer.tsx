import React from 'react';

import RedCanary from '../../assets/RedCanary.png';
import Symantec from '../../assets/Symantec.png';
import CrowdStrike from '../../assets/CrowdStrike.png';
import Cybereason from '../../assets/Cybereason.png';
import GoGuardian from '../../assets/GoGuardian.png';
import LogRhythm from '../../assets/LogRhythm.png';

import './OverviewContainer.scss';

const eventText = `Welcome to the inaugural World Hacker Summit! The goal of today's event is to spotlight
innovative thought leaders and to provide an opportunity to share and exchange new ideas,
technology trends and networking. Click here to watch a two-minute tutorial with
step-by-step instruction for how you can best maximize today's in-platform experience. We
encourage you to view the event schedule and to take full advantage of all that this
dynamic virtual event platform has to offer! Engage in real-time networking and Q&A
opportunities on a local, national, and global level. Grow your personal brand and your
community in the "Networking" area. Here you will get paired with like minded individuals
for 1:1 conversation. Take your virtual connections one step further — by initiating a
request to schedule a meeting or sending a direct message with anyone in the
"Participants" tab. You will have the opportunity to connect in a private conversation or
private video session with up to 9 other people. Enjoy today's event and don't forget to
download your virtual passport for your chance to win. Contest details are noted below:
Download Your Virtual Passport. Engage with booth representatives and ask for their unique
booth code. It's that easy! Enter the code of each booth you visit in the corresponding
passport field, along with your full name. To qualify, we ask that you visit a minimum of
4 booths. Submit your completed passport to Dorah Nielsen at dorah.nielsen@whs.com by 10
a.m. EST on 3/6. Stay tuned. Winners will be announced on 3/6 on our social media sites!`;

export const OverviewContainer = () => {
  return (
    <div className='overview-container'>
      <div className='overview-header'>HEADER</div>
      <div className='overview-tabs'>
        <span>Description</span>
        <span>Partners</span>
        <span>Schedule</span>
        <span>Speakers</span>
      </div>
      <div className='overview-title'>
        <div className='overview-title-content'>
          <div className='overview-title-icon'></div>
          <span className='overview-title-header'>World Hacker Summit 2021</span>
          <div className='overview-title-sub-header'>
            <span className='overview-title-sub-header-left'>Presented by</span>
            <span className='overview-title-sub-header-right'>Stream</span>
          </div>
        </div>
        <div className='overview-title-date'>
          <div className='overview-title-date-icon'>1</div>
        </div>
      </div>
      <div className='overview-content'>
        <div className='overview-content-container'>
          <div className='overview-content-title'>Description</div>
          <div className='overview-content-content'>{eventText}</div>
        </div>
        <div className='overview-content-stats'>STATS</div>
      </div>
      <div className='overview-partners'>
        <div className='overview-partners-title'>Partners</div>
        <div className='overview-partners-logos'>
          <img alt='RedCanary' src={RedCanary} />
          <img alt='Symantec' src={Symantec} />
          <img alt='CrowdStrike' src={CrowdStrike} />
          <img alt='Cybereason' src={Cybereason} />
          <img alt='GoGuardian' src={GoGuardian} />
          <img alt='LogRhythm' src={LogRhythm} />
        </div>
      </div>
      <div className='overview-schedule'>
        <div className='overview-schedule-title'>Schedule</div>
        <div className='overview-schedule-event'></div>
        <div className='overview-schedule-event'></div>
      </div>
    </div>
  );
};
