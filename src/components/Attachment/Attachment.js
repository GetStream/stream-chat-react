/* eslint-disable */
import React, { PureComponent } from 'react';
import { default as Media } from 'react-player';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';

import AttachmentActions from './AttachmentActions';

import Audio from './Audio';
import Card from './Card';
import File from './File';

import { Image } from '../Gallery';

export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/ogg',
  'video/webm',
  'video/quicktime',
];

/**
 * Attachment - The message attachment
 *
 * @example ../../docs/Attachment.md
 * @extends PureComponent
 */
const Attachment = (props) => {
  const { attachment } = props;
  if (isImageAttachment(attachment)) {
    return renderImage(props);
  }

  if (isFileAttachment(attachment)) {
    return renderFile(props);
  }

  if (isAudioAttachment(attachment)) {
    return renderAudio(props);
  }

  if (isMediaAttachment(attachment)) {
    return renderMedia(props);
  }

  return renderCard(props);
};

export const isImageAttachment = (a) => {
  return a.type === 'image' && !a.title_link && !a.og_scrape_url;
};

export const isMediaAttachment = (a) => {
  return a.mime_type && SUPPORTED_VIDEO_FORMATS.indexOf(a.mime_type) !== -1;
};

export const isAudioAttachment = (a) => {
  return a.type === 'audio';
};

export const isFileAttachment = (a) => {
  return (
    a.type === 'file' ||
    (a.mime_type && SUPPORTED_VIDEO_FORMATS.indexOf(a.mime_type) === -1)
  );
};

export const renderAttachmentWithinContainer = (
  children,
  attachment,
  componentType,
) => {
  let extra =
    attachment && attachment.actions && attachment.actions.length
      ? 'actions'
      : '';
  if (
    componentType === 'card' &&
    !attachment.image_url &&
    !attachment.thumb_url
  ) {
    extra = 'no-image';
  }

  return (
    <div
      className={`str-chat__message-attachment str-chat__message-attachment--${componentType} str-chat__message-attachment--${attachment.type} str-chat__message-attachment--${componentType}--${extra}`}
    >
      {children}
    </div>
  );
};

export const renderImage = (props) => {
  const { attachment: a, Image } = props;
  let children;
  if (a.actions && a.actions.length) {
    children = (
      <div className="str-chat__attachment" key={`key-image-${a.id}`}>
        <Image {...a} />
        {renderAttachmentActions(props)}
      </div>
    );
  } else {
    children = <Image {...a} key={`key-image-${a.id}`} />;
  }

  return renderAttachmentWithinContainer(children, a, 'image');
};

export const renderAttachmentActions = (props) => {
  const { attachment: a, AttachmentActions, actionHandler } = props;
  if (!a.actions || !a.actions.length) {
    return null;
  }

  return (
    <AttachmentActions
      key={'key-actions-' + a.id}
      {...a}
      actionHandler={actionHandler}
    />
  );
};

export const renderCard = (props) => {
  const { attachment: a, Card } = props;
  let children;

  if (a.actions && a.actions.length) {
    children = (
      <div className="str-chat__attachment" key={`key-image-${a.id}`}>
        <Card {...a} key={`key-card-${a.id}`} />
        {renderAttachmentActions(props)}
      </div>
    );
  } else {
    children = <Card {...a} key={`key-card-${a.id}`} />;
  }

  return renderAttachmentWithinContainer(children, a, 'card');
};

export const renderFile = (props) => {
  const { attachment: a, File } = props;
  if (!a.asset_url) return null;

  return renderAttachmentWithinContainer(
    <File attachment={a} key={`key-file-${a.id}`} />,
    a,
    'file',
  );
};

export const renderAudio = (props) => {
  const { attachment: a, Audio } = props;
  return renderAttachmentWithinContainer(
    <div className="str-chat__attachment" key={`key-video-${a.id}`}>
      <Audio og={a} />
    </div>,
    a,
    'audio',
  );
};

export const renderMedia = (props) => {
  const { attachment: a, Media } = props;
  let children;
  if (a.actions && a.actions.length) {
    children = (
      <div
        className="str-chat__attachment str-chat__attachment-media"
        key={`key-video-${a.id}`}
      >
        <div className="str-chat__player-wrapper">
          <Media
            className="react-player"
            url={a.asset_url}
            width="100%"
            height="100%"
            controls
          />
        </div>
        {renderAttachmentActions(props)}
      </div>
    );
  } else {
    children = (
      <div className="str-chat__player-wrapper" key={`key-video-${a.id}`}>
        <Media
          className="react-player"
          url={a.asset_url}
          width="100%"
          height="100%"
          controls
        />
      </div>
    );
  }

  return renderAttachmentWithinContainer(children, a, 'media');
};

Attachment.propTypes = {
  /**
   * The attachment to render
   * @see See [Attachment structure](https://getstream.io/chat/docs/#message_format)
   *
   *  */
  attachment: PropTypes.object.isRequired,
  /**
   *
   * Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
   *
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   */
  actionHandler: PropTypes.func,
  /**
   * Custom UI component for card type attachment
   * Defaults to [Card](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Card.js)
   */
  Card: PropTypes.elementType,
  /**
   * Custom UI component for file type attachment
   * Defaults to [File](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/File.js)
   */
  File: PropTypes.elementType,
  /**
   * Custom UI component for image type attachment
   * Defaults to [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.js)
   */
  Image: PropTypes.elementType,
  /**
   * Custom UI component for audio type attachment
   * Defaults to [Audio](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Audio.js)
   */
  Audio: PropTypes.elementType,
  /**
   * Custom UI component for media type attachment
   * Defaults to [ReactPlayer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/ReactPlayer.js)
   */
  Media: PropTypes.elementType,
  /**
   * Custom UI component for attachment actions
   * Defaults to [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.js)
   */
  AttachmentActions: PropTypes.elementType,
};

Attachment.defaultProps = {
  Card,
  Image,
  Audio,
  File,
  Media,
  AttachmentActions,
};
export default Attachment;
