// @ts-check

import React from 'react';
import DefaultMedia from 'react-player';
import PropTypes from 'prop-types';

import DefaultAttachmentActions from './AttachmentActions';

import DefaultAudio from './Audio';
import DefaultCard from './Card';
import DefaultFile from './FileAttachment';

import { Image as DefaultImage } from '../Gallery';

export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/ogg',
  'video/webm',
  'video/quicktime',
];

/**
 * @typedef {import('types').ExtendedAttachment} ExtendedAttachment
 * @typedef {Required<Pick<import('types').AttachmentUIComponentProps, 'Card' | 'File' | 'Image' | 'Audio' | 'Media' | 'AttachmentActions'>>} DefaultProps
 * @typedef {Omit<import('types').AttachmentUIComponentProps, 'Card' | 'File' | 'Image' | 'Audio' | 'Media' | 'AttachmentActions'> & DefaultProps} AttachmentProps
 */

/**
 * @param {ExtendedAttachment} a
 */
export const isImageAttachment = (a) => {
  return a.type === 'image' && !a.title_link && !a.og_scrape_url;
};

/**
 * @param {ExtendedAttachment} a
 */
export const isMediaAttachment = (a) => {
  return (
    (a.mime_type && SUPPORTED_VIDEO_FORMATS.indexOf(a.mime_type) !== -1) ||
    a.type === 'video'
  );
};

/**
 * @param {ExtendedAttachment} a
 */
export const isAudioAttachment = (a) => {
  return a.type === 'audio';
};

/**
 * @param {ExtendedAttachment} a
 */
export const isFileAttachment = (a) => {
  return (
    a.type === 'file' ||
    (a.mime_type &&
      SUPPORTED_VIDEO_FORMATS.indexOf(a.mime_type) === -1 &&
      a.type !== 'video')
  );
};

/**
 * @param {React.ReactNode} children
 * @param {ExtendedAttachment} attachment
 * @param {string} componentType
 */
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

/**
 * @param {AttachmentProps} props
 */
export const renderAttachmentActions = (props) => {
  const { attachment: a, AttachmentActions, actionHandler } = props;
  if (!a.actions || !a.actions.length) {
    return null;
  }

  return (
    <AttachmentActions
      {...a}
      id={a.id || ''}
      actions={a.actions || []}
      text={a.text || ''}
      key={`key-actions-${a.id}`}
      actionHandler={actionHandler}
    />
  );
};

/**
 * @param {AttachmentProps} props
 */
export const renderImage = (props) => {
  const { attachment: a, Image } = props;
  if (a.actions && a.actions.length) {
    return renderAttachmentWithinContainer(
      <div className="str-chat__attachment" key={`key-image-${a.id}`}>
        <Image {...a} />
        {renderAttachmentActions(props)}
      </div>,
      a,
      'image',
    );
  }

  return renderAttachmentWithinContainer(
    <Image {...a} key={`key-image-${a.id}`} />,
    a,
    'image',
  );
};

/**
 * @param {AttachmentProps} props
 */
export const renderCard = (props) => {
  const { attachment: a, Card } = props;
  if (a.actions && a.actions.length) {
    return renderAttachmentWithinContainer(
      <div className="str-chat__attachment" key={`key-image-${a.id}`}>
        <Card {...a} key={`key-card-${a.id}`} />
        {renderAttachmentActions(props)}
      </div>,
      a,
      'card',
    );
  }

  return renderAttachmentWithinContainer(
    <Card {...a} key={`key-card-${a.id}`} />,
    a,
    'card',
  );
};

/**
 * @param {AttachmentProps} props
 */
export const renderFile = (props) => {
  const { attachment: a, File } = props;
  if (!a.asset_url) return null;

  return renderAttachmentWithinContainer(
    <File attachment={a} key={`key-file-${a.id}`} />,
    a,
    'file',
  );
};

/**
 * @param {AttachmentProps} props
 */
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

/**
 * @param {AttachmentProps} props
 */
export const renderMedia = (props) => {
  const { attachment: a, Media } = props;
  if (a.actions && a.actions.length) {
    return renderAttachmentWithinContainer(
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
      </div>,
      a,
      'media',
    );
  }

  return renderAttachmentWithinContainer(
    <div className="str-chat__player-wrapper" key={`key-video-${a.id}`}>
      <Media
        className="react-player"
        url={a.asset_url}
        width="100%"
        height="100%"
        controls
      />
    </div>,
    a,
    'media',
  );
};

/**
 * Attachment - The message attachment
 *
 * @example ../../docs/Attachment.md
 * @type { React.FC<import('types').AttachmentUIComponentProps> }
 */
const Attachment = ({
  attachment,
  Card = DefaultCard,
  Image = DefaultImage,
  Audio = DefaultAudio,
  File = DefaultFile,
  Media = DefaultMedia,
  AttachmentActions = DefaultAttachmentActions,
  ...rest
}) => {
  const propsWithDefault = {
    attachment,
    Card,
    Image,
    Audio,
    File,
    Media,
    AttachmentActions,
    ...rest,
  };

  if (isImageAttachment(attachment)) {
    return renderImage(propsWithDefault);
  }

  if (isFileAttachment(attachment)) {
    return renderFile(propsWithDefault);
  }

  if (isAudioAttachment(attachment)) {
    return renderAudio(propsWithDefault);
  }

  if (isMediaAttachment(attachment)) {
    return renderMedia(propsWithDefault);
  }

  return renderCard(propsWithDefault);
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
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   */
  actionHandler: PropTypes.func,
  /**
   * Custom UI component for card type attachment
   * Defaults to [Card](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Card.js)
   */
  Card: /** @type {PropTypes.Validator<React.ComponentType<import('types').CardProps>>} */ (PropTypes.elementType),
  /**
   * Custom UI component for file type attachment
   * Defaults to [File](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/File.js)
   */
  File: /** @type {PropTypes.Validator<React.ComponentType<import('types').FileAttachmentProps>>} */ (PropTypes.elementType),
  /**
   * Custom UI component for image type attachment
   * Defaults to [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.js)
   */
  Image: /** @type {PropTypes.Validator<React.ComponentType<import('types').ImageProps>>} */ (PropTypes.elementType),
  /**
   * Custom UI component for audio type attachment
   * Defaults to [Audio](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Audio.js)
   */
  Audio: /** @type {PropTypes.Validator<React.ComponentType<import('types').AudioProps>>} */ (PropTypes.elementType),
  /**
   * Custom UI component for media type attachment
   * Defaults to [ReactPlayer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/ReactPlayer.js)
   */
  Media: /** @type {PropTypes.Validator<React.ComponentType<import('react-player').ReactPlayerProps>>} */ (PropTypes.elementType),
  /**
   * Custom UI component for attachment actions
   * Defaults to [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.js)
   */
  AttachmentActions: /** @type {PropTypes.Validator<React.ComponentType<import('types').AttachmentActionsProps>>} */ (PropTypes.elementType),
};

export default Attachment;
