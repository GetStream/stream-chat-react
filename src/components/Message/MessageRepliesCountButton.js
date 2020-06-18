// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TranslationContext } from '../../context';

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
        <svg width="18" height="15" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M.56 10.946H.06l-.002-.498L.025.92a.5.5 0 1 1 1-.004l.032 9.029H9.06v-4l9 4.5-9 4.5v-4H.56z"
            fillRule="nonzero"
          />
        </svg>
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
