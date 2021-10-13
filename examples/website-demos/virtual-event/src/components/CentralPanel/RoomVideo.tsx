import { BaseSyntheticEvent, useEffect, useState } from 'react';
import lottie from 'lottie-web';

import { getParticipantOrder } from './data';

import {
  BackArrow,
  ConnectionStatusBad,
  ConnectionStatusGood,
  ConnectionStatusGreat,
  Listening,
  Muted,
  ParticipantsIcon,
  SpeakingAnimation,
  VideoViewersIcon,
  VideoWatermark,
} from '../../assets';
import { useVideoContext } from '../../contexts/VideoContext';

type Props = {
  handleBackArrow: (event: BaseSyntheticEvent) => void;
};

export const RoomVideo: React.FC<Props> = ({ handleBackArrow }) => {
  const [isPinned, setIsPinned] = useState(true);
  const [pinnedID, setPinnedID] = useState<string | null>('1');

  const { eventNumber, label, presenters, title, viewers } = useVideoContext();

  useEffect(() => {
    lottie.loadAnimation({
      container: document.querySelector('#speaking-animation') as HTMLElement,
      animationData: SpeakingAnimation,
    });
  }, []);

  const handleClick = (event: BaseSyntheticEvent) => {
    if (!isPinned) {
      setIsPinned(true);
      setPinnedID(event.target.id);
    }

    if (isPinned && event.target.id === pinnedID) {
      setIsPinned(false);
      setPinnedID(null);
    }

    if (isPinned && pinnedID !== event.target.id) {
      setPinnedID(event.target.id);
    }
  };

  const participantOrder = getParticipantOrder(eventNumber);

  return (
    <div className='room-video-container'>
      <VideoWatermark />
      <div className='room-video-header'>
        <div className='room-video-header-title'>
          <div className='room-video-header-title-arrow' onClick={handleBackArrow}>
            <BackArrow />
          </div>
          <div className='room-video-header-title-title'>{title}</div>
          <div className='room-video-header-title-dot'></div>
          <div className='room-video-header-title-recording'>Recording</div>
        </div>
        <div className='room-video-header-title-right'>
          <ParticipantsIcon />
          <div>{presenters}</div>
          <VideoViewersIcon />
          <div>{viewers}</div>
          <div className={`event-card-label ${label?.toLowerCase()}`}>{label}</div>
        </div>
      </div>
      <div className={`room-video-grid ${isPinned ? 'isPinned' : ''}`}>
        <div
          className={`room-video-grid-participant ${pinnedID === '1' ? 'pinned' : ''}`}
          id='1'
          onClick={handleClick}
        >
          <video autoPlay id='1' loop src={participantOrder[0].video} />
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>{participantOrder[0].name}</div>
            <div id='speaking-animation' />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatusGreat />
          </div>
        </div>
        <div
          className={`room-video-grid-participant ${pinnedID === '2' ? 'pinned' : ''}`}
          id='2'
          onClick={handleClick}
        >
          <video autoPlay id='2' loop src={participantOrder[1].video} />
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>{participantOrder[1].name}</div>
            <Listening />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatusGood />
          </div>
        </div>
        <div
          className={`room-video-grid-participant ${pinnedID === '3' ? 'pinned' : ''}`}
          id='3'
          onClick={handleClick}
        >
          <video autoPlay id='3' loop src={participantOrder[2].video} />
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>{participantOrder[2].name}</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatusBad />
          </div>
        </div>
        <div
          className={`room-video-grid-participant ${pinnedID === '4' ? 'pinned' : ''}`}
          id='4'
          onClick={handleClick}
        >
          <video autoPlay id='4' loop src={participantOrder[3].video} />
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>{participantOrder[3].name}</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatusGreat />
          </div>
        </div>
        <div
          className={`room-video-grid-participant ${pinnedID === '5' ? 'pinned' : ''}`}
          id='5'
          onClick={handleClick}
        >
          <video autoPlay id='5' loop src={participantOrder[4].video} />
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>{participantOrder[4].name}</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatusGood />
          </div>
        </div>
        <div
          className={`room-video-grid-participant ${pinnedID === '6' ? 'pinned' : ''}`}
          id='6'
          onClick={handleClick}
        >
          <video autoPlay id='6' loop src={participantOrder[5].video} />
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>{participantOrder[5].name}</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatusBad />
          </div>
        </div>
      </div>
    </div>
  );
};
