import React, { PureComponent } from 'react';
import ReactPlayer from 'react-player';
import { Card } from './Card';
import { Image } from './Image';
import { AttachmentActions } from './AttachmentActions';
import { FileIcon } from 'react-file-utils';
import prettybytes from 'pretty-bytes';
import PropTypes from 'prop-types';
import { SafeAnchor } from './SafeAnchor';
/**
 * Attachment - The message attachment
 *
 * @example ./docs/Attachment.md
 * @extends PureComponent
 */
export class Attachment extends PureComponent {
  attachmentRef = React.createRef();
  static propTypes = {
    /** The attachment to render */
    attachment: PropTypes.object.isRequired,
    /**
		The handler function to call when an action is selected on an attachment.
		Examples include canceling a \/giphy command or shuffling the results.
		*/
    actionHandler: PropTypes.func.isRequired,
  };

  render() {
    const { attachment: a } = this.props;
    if (!a) {
      return null;
    }

    let type, extra;
    if (a.actions && a.actions.length > 0) {
      extra = 'actions';
    }
    if (a.type === 'giphy' || a.type === 'imgur') {
      type = 'card';
    } else if (a.type === 'image' && a.title_link) {
      type = 'card';
    } else if (a.type === 'image') {
      type = 'image';
    } else if (a.type === 'file') {
      type = 'file';
    } else if (a.type === 'video' || a.type === 'audio') {
      type = 'media';
    } else {
      type = 'card';
      extra = 'no-image';
    }

    if (type === 'card' && !a.title_link) {
      return null;
    }
    const results = [];
    if (type === 'card') {
      if (a.actions && a.actions.length) {
        results.push(
          <div style={{ maxWidth: 450 }} key={`key-image-${a.id}`}>
            <Card {...a} key={`key-card-${a.id}`} />
            <AttachmentActions
              key={'key-actions-' + a.id}
              {...a}
              actionHandler={this.props.actionHandler}
            />
          </div>,
        );
      } else {
        results.push(<Card {...a} key={`key-card-${a.id}`} />);
      }
    } else if (type === 'image') {
      if (a.actions && a.actions.length) {
        results.push(
          <div style={{ maxWidth: 450 }} key={`key-image-${a.id}`}>
            <Image {...a} />
            <AttachmentActions
              key={'key-actions-' + a.id}
              {...a}
              actionHandler={this.props.actionHandler}
            />
          </div>,
        );
      } else {
        results.push(<Image {...a} key={`key-image-${a.id}`} />);
      }
    } else if (type === 'file') {
      results.push(
        <div
          className="str-chat__message-attachment-file--item"
          key={`key-file-${a.id}`}
        >
          <FileIcon mimeType={a.mime_type} filename={a.title} big size={30} />
          <div className="str-chat__message-attachment-file--item-text">
            <SafeAnchor href={a.asset_url} download>
              {a.title}
            </SafeAnchor>
            {a.file_size && <span>{prettybytes(a.file_size)}</span>}
          </div>
        </div>,
      );
    } else if (type === 'media') {
      if (a.actions && a.actions.length) {
        results.push(
          <div style={{ maxWidth: 450 }} key={`key-video-${a.id}`}>
            <div className="str-chat__player-wrapper">
              <ReactPlayer
                className="react-player"
                url={a.asset_url}
                width="100%"
                height="100%"
                controls
              />
            </div>
            <AttachmentActions
              key={'key-actions-' + a.id}
              {...a}
              actionHandler={this.props.actionHandler}
            />
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
        results.push(
          <div style={{ maxWidth: 450 }} key={`key-image-${a.id}`}>
            <Card {...a} key={`key-card-${a.id}`} />
            <AttachmentActions
              key={'key-actions-' + a.id}
              {...a}
              actionHandler={this.props.actionHandler}
            />
          </div>,
        );
      } else {
        results.push(<Card {...a} key={`key-card-${a.id}`} />);
      }
    }

    return (
      <div
        className={`str-chat__message-attachment str-chat__message-attachment--${type} str-chat__message-attachment--${type}--${extra}`}
        ref={this.attachmentRef}
      >
        {results}
      </div>
    );
  }
}

Attachment.propTypes = {};
