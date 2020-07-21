// @ts-check
import React, { useContext } from 'react';
import { TranslationContext } from '../../context';

export const defaultTimestampFormat = 'h:mmA';

/**
 * @typedef { import('types').MessageTimestampProps } Props
 * @type { React.FC<Props> }
 */
const MessageTimestamp = (props) => {
  const {
    customClass = '',
    tDateTimeParser: propTDatetimeParser,
    format = defaultTimestampFormat,
    calendar = false,
    message,
  } = props;
  const { tDateTimeParser: contextTDateTimeParser } = useContext(
    TranslationContext,
  );
  const tDateTimeParser = propTDatetimeParser || contextTDateTimeParser;

  if (!message || !tDateTimeParser || !Date.parse(message.created_at)) {
    return null;
  }
  const parsedTime = tDateTimeParser(message.created_at);

  if (calendar && typeof parsedTime.calendar !== 'function') {
    return null;
  }

  const when = calendar ? parsedTime.calendar() : parsedTime.format(format);

  return (
    <time
      className={customClass}
      dateTime={message?.created_at}
      title={message?.created_at}
    >
      {when}
    </time>
  );
};

export default React.memo(MessageTimestamp);
