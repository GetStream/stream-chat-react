import clsx from 'clsx';

export const QuotedMessageIndicator = ({ isOwnMessage }: { isOwnMessage?: boolean }) => (
  <div
    className={clsx('str-chat__quoted-message-indicator', {
      'str-chat__quoted-message-indicator--own-message': isOwnMessage,
    })}
  />
);
