// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TranslationContext } from '../../context';
import { useUserRole } from './hooks/useUserRole';
import { MessagePropTypes } from './utils';

/**
 * @type{React.FC<import('types').MessageDeletedProps>}
 */
const MessageDeleted = (props) => {
  const { message } = props;
  const { t } = useContext(TranslationContext);
  const { isMyMessage } = useUserRole(message);
  if (props.isMyMessage) {
    console.warn(
      'The isMyMessage is deprecated, and will be removed in the next major release.',
    );
  }
  const messageClasses =
    (props.isMyMessage && props.isMyMessage(message)) || isMyMessage
      ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
      : 'str-chat__message str-chat__message-simple';

  return (
    <div
      key={message.id}
      className={`${messageClasses} str-chat__message--deleted ${message.type} `}
      data-testid={'message-deleted-component'}
    >
      <div className="str-chat__message--deleted-inner">
        {t && t('This message was deleted...')}
      </div>
    </div>
  );
};

MessageDeleted.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  // @ts-ignore
  // Ignoring this for now as Typescript definitions on 'strem-chat' are wrong.
  message: MessagePropTypes,
  /** @deprecated This is no longer needed. The component should now rely on the user role custom hook */
  isMyMessage: PropTypes.func,
};

export default MessageDeleted;
