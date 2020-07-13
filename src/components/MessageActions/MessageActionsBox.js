// @ts-check
import React, { useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import { MESSAGE_ACTIONS } from '../Message/utils';
import { TranslationContext } from '../../context';

/** @type {React.FC<import("types").MessageActionsBoxProps>} */
const MessageActionsBox = ({
  handleFlag,
  handleMute,
  handleEdit,
  handleDelete,
  getMessageActions,
  isUserMuted,
  open = false,
  mine,
  messageListRect,
}) => {
  const { t } = useContext(TranslationContext);
  const messageActions = getMessageActions();
  const [reverse, setReverse] = useState(false);

  const checkIfReverse = useCallback(
    (containerElement) => {
      if (!containerElement) {
        setReverse(false);
        return;
      }
      if (open) {
        const containerRect = containerElement.getBoundingClientRect();

        if (mine) {
          setReverse(
            !!messageListRect && containerRect.left < messageListRect.left,
          );
        } else {
          setReverse(
            !!messageListRect &&
              containerRect.right + 5 > messageListRect.right,
          );
        }
      }
    },
    [messageListRect, mine, open],
  );

  return (
    <div
      data-testid="message-actions-box"
      className={`str-chat__message-actions-box
        ${open ? 'str-chat__message-actions-box--open' : ''}
        ${mine ? 'str-chat__message-actions-box--mine' : ''}
        ${reverse ? 'str-chat__message-actions-box--reverse' : ''}
      `}
      ref={checkIfReverse}
    >
      <ul className="str-chat__message-actions-list">
        {messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1 && (
          <button onClick={handleFlag}>
            <li className="str-chat__message-actions-list-item">{t('Flag')}</li>
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1 && (
          <button onClick={handleMute}>
            <li className="str-chat__message-actions-list-item">
              {isUserMuted && isUserMuted() ? t('Unmute') : t('Mute')}
            </li>
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 && (
          <button onClick={handleEdit}>
            <li className="str-chat__message-actions-list-item">
              {t('Edit Message')}
            </li>
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 && (
          <button onClick={handleDelete}>
            <li className="str-chat__message-actions-list-item">
              {t('Delete')}
            </li>
          </button>
        )}
      </ul>
    </div>
  );
};

MessageActionsBox.propTypes = {
  /** If the message actions box should be open or not */
  open: PropTypes.bool,
  /** If message belongs to current user. */
  mine: PropTypes.bool,
  /** DOMRect object for parent MessageList component */
  messageListRect: /** @type {PropTypes.Validator<DOMRect>} */ (PropTypes.object),
  /**
   * Handler for flaging a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleFlag: PropTypes.func,
  /**
   * Handler for muting a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleMute: PropTypes.func,
  /**
   * Handler for editing a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleEdit: PropTypes.func,
  /**
   * Handler for deleting a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleDelete: PropTypes.func,
  /**
   * Returns array of avalable message actions for current message.
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   */
  getMessageActions: PropTypes.func.isRequired,
};
export default React.memo(MessageActionsBox);
