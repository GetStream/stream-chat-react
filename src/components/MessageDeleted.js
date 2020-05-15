import React from 'react';
import PropTypes from 'prop-types';
import { withTranslationContext } from '../context';

class MessageDeleted extends React.PureComponent {
  static propTypes = {
    /** The [message object](https://getstream.io/chat/docs/#message_format) */
    message: PropTypes.object,
    /** Returns true if message belongs to current user */
    isMyMessage: PropTypes.func,
  };

  render() {
    const { isMyMessage, message, t } = this.props;
    const messageClasses = isMyMessage(message)
      ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
      : 'str-chat__message str-chat__message-simple';

    return (
      <div
        key={message.id}
        className={`${messageClasses} str-chat__message--deleted ${message.type} `}
        data-testid={'message-deleted-component'}
      >
        <div className="str-chat__message--deleted-inner">
          {t('This message was deleted...')}
        </div>
      </div>
    );
  }
}

export default withTranslationContext(MessageDeleted);
