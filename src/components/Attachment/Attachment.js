/* eslint-disable */
import React, { PureComponent } from 'react';
import ReactPlayer from 'react-player';
import prettybytes from 'pretty-bytes';
import PropTypes from 'prop-types';
import { FileIcon } from 'react-file-utils';

import AttachmentActions from './AttachmentActions';
import { Audio } from '../Audio';
import { Image } from '../Image';
import { Card } from '../Card';
import { SafeAnchor } from '../SafeAnchor';

/**
 * Attachment - The message attachment
 *
 * @example ../../docs/Attachment.md
 * @extends PureComponent
 */
class Attachment extends PureComponent {
  attachmentRef = React.createRef();
  static propTypes = {
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
    actionHandler: PropTypes.func.isRequired,
  };

  attachmentType(a) {
    let type, extra;
    if (a.actions && a.actions.length > 0) {
      extra = 'actions';
    }
    if (a.type === 'giphy' || a.type === 'imgur') {
      type = 'card';
    } else if (a.type === 'image' && (a.title_link || a.og_scrape_url)) {
      type = 'card';
    } else if (a.type === 'image') {
      type = 'image';
    } else if (
      a.type === 'video' ||
      (a.mime_type && a.mime_type.indexOf('video/') !== -1)
    ) {
      type = 'media';
    } else if (a.type === 'file') {
      type = 'file';
    } else if (a.type === 'audio') {
      type = 'audio';
    } else {
      type = 'card';
      extra = 'no-image';
    }
    return { type, extra };
  }

  renderAttachmentActions = (a) => (
    <AttachmentActions
      key={'key-actions-' + a.id}
      {...a}
      actionHandler={this.props.actionHandler}
    />
  );

  renderAttachment = (a) => (
    <div className="str-chat__attachment" key={`key-image-${a.id}`}>
      <Card {...a} key={`key-card-${a.id}`} />
      {this.renderAttachmentActions(a)}
    </div>
  );

  render() {
    const { attachment: a } = this.props;
    if (!a) {
      return null;
    }

    const { type, extra } = this.attachmentType(a);
    if (type === 'card' && !a.title_link && !a.og_scrape_url) {
      return null;
    }
    const results = [];
    if (type === 'image') {
      if (a.actions && a.actions.length) {
        results.push(
          <div className="str-chat__attachment" key={`key-image-${a.id}`}>
            <Image {...a} />
            {this.renderAttachmentActions(a)}
          </div>,
        );
      } else {
        results.push(<Image {...a} key={`key-image-${a.id}`} />);
      }
    } else if (type === 'file') {
      a.asset_url &&
        results.push(
          <div
            data-testid="attachment-file"
            className="str-chat__message-attachment-file--item"
            key={`key-file-${a.id}`}
          >
            <FileIcon
              mimeType={a.mime_type}
              filename={a.title}
              big={true}
              size={30}
            />
            <div className="str-chat__message-attachment-file--item-text">
              <SafeAnchor href={a.asset_url} target="_blank" download>
                {a.title}
              </SafeAnchor>
              {a.file_size && <span>{prettybytes(a.file_size)}</span>}
            </div>
          </div>,
        );
    } else if (type === 'audio') {
      results.push(
        <div className="str-chat__attachment" key={`key-video-${a.id}`}>
          <Audio og={a} />
        </div>,
      );
    } else if (type === 'media') {
      if (a.actions && a.actions.length) {
        results.push(
          <div
            className="str-chat__attachment str-chat__attachment-media"
            key={`key-video-${a.id}`}
          >
            <div className="str-chat__player-wrapper">
              <ReactPlayer
                className="react-player"
                url={a.asset_url}
                width="100%"
                height="100%"
                controls
              />
            </div>
            {this.renderAttachmentActions(a)}
          </div>,
        );
      } else {
        results.push(
          <div className="str-chat__player-wrapper" key={`key-video-${a.id}`}>
            <ReactPlayer
              className="react-player"
              url={a.asset_url}
              width="100%"
              height="100%"
              controls
            />
          </div>,
        );
      }
    } else {
      if (a.actions && a.actions.length) {
        results.push(this.renderAttachment(a));
      } else {
        results.push(<Card {...a} key={`key-card-${a.id}`} />);
      }
    }

    if (results.length === 0) return null;

    return (
      <div
        className={`str-chat__message-attachment str-chat__message-attachment--${type} str-chat__message-attachment--${a.type} str-chat__message-attachment--${type}--${extra}`}
        ref={this.attachmentRef}
      >
        {results}
      </div>
    );
  }
}

Attachment.propTypes = {};

export default Attachment;
