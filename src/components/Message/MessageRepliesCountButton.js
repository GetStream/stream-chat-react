// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TranslationContext } from '../../context';
import { ReplyIcon } from './icons';

/** @type {React.FC<import("types").MessageRepliesCountButtonProps>} */
const MessageRepliesCountButton = ({
  reply_count,
  labelSingle,
  labelPlural,
  onClick,
}) => {
  const { t } = useContext(TranslationContext);
  let singleReplyText;
  let pluralReplyText;

  if (reply_count === 1) {
    if (labelSingle) {
      singleReplyText = `1 ${labelSingle}`;
    } else {
      singleReplyText = t('1 reply');
    }
  }

  if (reply_count && reply_count > 1) {
    if (labelPlural) {
      pluralReplyText = `${reply_count} ${labelPlural}`;
    } else {
      pluralReplyText = t('{{ replyCount }} replies', {
        replyCount: reply_count,
      });
    }
  }

  if (reply_count && reply_count !== 0) {
    return (
      <button
        data-testid="replies-count-button"
        className="str-chat__message-replies-count-button"
        onClick={onClick}
      >
        <ReplyIcon />
        {reply_count === 1 ? singleReplyText : pluralReplyText}
      </button>
    );
  }
  return null;
};

MessageRepliesCountButton.defaultProps = {
  reply_count: 0,
};

MessageRepliesCountButton.propTypes = {
  /** Label for number of replies, when count is 1 */
  labelSingle: PropTypes.string,
  /** Label for number of replies, when count is more than 1 */
  labelPlural: PropTypes.string,
  /** Number of replies */
  reply_count: PropTypes.number,
  /**
   * click handler for button
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  onClick: PropTypes.func,
};

export default React.memo(MessageRepliesCountButton);
