import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { Attachment } from 'stream-chat';

import type { DefaultAttachmentType } from '../../types/types';

const progressUpdateInterval = 500;

export type AudioProps<At extends DefaultAttachmentType = DefaultAttachmentType> = {
  og: Attachment<At>;
};

const UnMemoizedAudio = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: AudioProps<At>,
) => {
  const { og } = props;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateProgress = useCallback(() => {
    if (audioRef.current !== null) {
      const position = audioRef.current.currentTime;
      const { duration } = audioRef.current;
      const currentProgress = (100 / duration) * position;
      setProgress(currentProgress);
      if (position === duration) {
        setIsPlaying(false);
      }
    }
  }, [audioRef]);

  useEffect(() => {
    if (audioRef.current !== null) {
      if (isPlaying) {
        audioRef.current.play();
        const interval = setInterval(updateProgress, progressUpdateInterval);
        return () => clearInterval(interval);
      }
      audioRef.current.pause();
    }
    return;
  }, [isPlaying, updateProgress]);

  const { asset_url, description, image_url, text, title } = og;

  return (
    <div className='str-chat__audio'>
      <div className='str-chat__audio__wrapper'>
        <audio ref={audioRef}>
          <source data-testid='audio-source' src={asset_url} type='audio/mp3' />
        </audio>
        <div className='str-chat__audio__image'>
          <div className='str-chat__audio__image--overlay'>
            {!isPlaying ? (
              <div
                className='str-chat__audio__image--button'
                data-testid='play-audio'
                onClick={() => setIsPlaying(true)}
              >
                <svg height='40' viewBox='0 0 64 64' width='40' xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M32 58c14.36 0 26-11.64 26-26S46.36 6 32 6 6 17.64 6 32s11.64 26 26 26zm0 6C14.327 64 0 49.673 0 32 0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32zm13.237-28.412L26.135 45.625a3.27 3.27 0 0 1-4.426-1.4 3.319 3.319 0 0 1-.372-1.47L21 23.36c-.032-1.823 1.41-3.327 3.222-3.358a3.263 3.263 0 0 1 1.473.322l19.438 9.36a3.311 3.311 0 0 1 .103 5.905z'
                    fillRule='nonzero'
                  />
                </svg>
              </div>
            ) : (
              <div
                className='str-chat__audio__image--button'
                data-testid='pause-audio'
                onClick={() => setIsPlaying(false)}
              >
                <svg height='40' viewBox='0 0 64 64' width='40' xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M32 58.215c14.478 0 26.215-11.737 26.215-26.215S46.478 5.785 32 5.785 5.785 17.522 5.785 32 17.522 58.215 32 58.215zM32 64C14.327 64 0 49.673 0 32 0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32zm-7.412-45.56h2.892a2.17 2.17 0 0 1 2.17 2.17v23.865a2.17 2.17 0 0 1-2.17 2.17h-2.892a2.17 2.17 0 0 1-2.17-2.17V20.61a2.17 2.17 0 0 1 2.17-2.17zm12.293 0h2.893a2.17 2.17 0 0 1 2.17 2.17v23.865a2.17 2.17 0 0 1-2.17 2.17h-2.893a2.17 2.17 0 0 1-2.17-2.17V20.61a2.17 2.17 0 0 1 2.17-2.17z'
                    fillRule='nonzero'
                  />
                </svg>
              </div>
            )}
          </div>
          {image_url && <img alt={`${description}`} src={image_url} />}
        </div>
        <div className='str-chat__audio__content'>
          <span className='str-chat__audio__content--title'>
            <strong>{title}</strong>
          </span>
          <span className='str-chat__audio__content--subtitle'>{text}</span>
          <div className='str-chat__audio__content--progress'>
            <div data-testid='audio-progress' style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Audio attachment with play/pause button and progress bar
 */
export const Audio = React.memo(UnMemoizedAudio) as typeof UnMemoizedAudio;
