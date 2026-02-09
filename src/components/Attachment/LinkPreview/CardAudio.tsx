import { type AudioPlayerState, useAudioPlayer } from '../../AudioPlayback';
import { useMessageContext } from '../../../context';
import { useStateStore } from '../../../store';
import { PlayButton } from '../../Button';
import { ProgressBar } from '../components';
import type { AudioProps } from '../Audio';
import React from 'react';
import { IconChainLink } from '../../Icons';
import { SafeAnchor } from '../../SafeAnchor';
import type { CardProps } from './Card';

const getHostFromURL = (url?: string | null) => {
  if (url !== undefined && url !== null) {
    const [trimmedUrl] = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/');

    return trimmedUrl;
  }
  return null;
};

const SourceLink = ({
  author_name,
  showUrl,
  url,
}: Pick<CardProps, 'author_name'> & { url: string; showUrl?: boolean }) => (
  <div
    className='str-chat__message-attachment-card--source-link'
    data-testid='card-source-link'
  >
    <IconChainLink />
    <SafeAnchor
      className='str-chat__message-attachment-card--url'
      href={url}
      rel='noopener noreferrer'
      target='_blank'
    >
      {showUrl ? url : author_name || getHostFromURL(url)}
    </SafeAnchor>
  </div>
);

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  isPlaying: state.isPlaying,
  progress: state.progressPercent,
});

const AudioWidget = ({ mimeType, src }: { src: string; mimeType?: string }) => {
  /**
   * Introducing message context. This could be breaking change, therefore the fallback to {} is provided.
   * If this component is used outside the message context, then there will be no audio player namespacing
   * => scrolling away from the message in virtualized ML would create a new AudioPlayer instance.
   *
   * Edge case: the requester (message) has multiple attachments with the same assetURL - does not happen
   * with the default SDK components, but can be done with custom API calls.In this case all the Audio
   * widgets will share the state.
   */
  const { message, threadList } = useMessageContext() ?? {};

  const audioPlayer = useAudioPlayer({
    mimeType,
    requester:
      message?.id &&
      `${threadList ? (message.parent_id ?? message.id) : ''}${message.id}`,
    src,
  });

  const { isPlaying, progress } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  if (!audioPlayer) return;

  return (
    <div className='str-chat__message-attachment-card-audio-widget--first-row'>
      <div className='str-chat__message-attachment-audio-widget--play-controls'>
        <PlayButton isPlaying={!!isPlaying} onClick={audioPlayer.togglePlay} />
      </div>
      <ProgressBar onClick={audioPlayer.seek} progress={progress ?? 0} />
    </div>
  );
};

export const CardAudio = ({
  attachment: {
    asset_url,
    author_name,
    mime_type,
    og_scrape_url,
    text,
    title,
    title_link,
  },
}: AudioProps) => {
  const url = title_link || og_scrape_url;
  const dataTestId = 'card-audio-widget';
  const rootClassName = 'str-chat__message-attachment-card-audio-widget';
  return (
    <div className={rootClassName} data-testid={dataTestId}>
      {asset_url && <AudioWidget mimeType={mime_type} src={asset_url} />}
      <div className='str-chat__message-attachment-audio-widget--second-row'>
        {url && <SourceLink author_name={author_name} url={url} />}
        {title && (
          <div className='str-chat__message-attachment-audio-widget--title'>{title}</div>
        )}
        {text && (
          <div className='str-chat__message-attachment-audio-widget--description'>
            {text}
          </div>
        )}
      </div>
    </div>
  );
};
