/* eslint-disable no-continue */
export const insertDates = (
  messages,
  lastRead,
  userID,
  hideDeletedMessages,
) => {
  let unread = false;
  let lastDateSeparator;
  const newMessages = [];

  for (let i = 0, l = messages.length; i < l; i += 1) {
    const message = messages[i];

    if (hideDeletedMessages && message.type === 'deleted') {
      continue;
    }

    if (message.type === 'message.read') {
      newMessages.push(message);
      continue;
    }

    const messageDate = message.created_at.toDateString();
    let prevMessageDate = messageDate;

    if (i > 0) {
      prevMessageDate = messages[i - 1].created_at.toDateString();
    }

    if (!unread) {
      unread = lastRead && new Date(lastRead) < message.created_at;

      // do not show date separator for current user's messages
      if (unread && message.user.id !== userID) {
        newMessages.push({
          type: 'message.date',
          date: message.created_at,
          id: message.id,
          unread,
        });
      }
    }

    if (
      (i === 0 ||
        messageDate !== prevMessageDate ||
        (hideDeletedMessages &&
          messages[i - 1]?.type === 'deleted' &&
          lastDateSeparator !== messageDate)) &&
      newMessages?.[newMessages.length - 1]?.type !== 'message.date' // do not show two date separators in a row
    ) {
      lastDateSeparator = messageDate;

      newMessages.push(
        {
          type: 'message.date',
          date: message.created_at,
          id: message.id,
        },
        message,
      );
    } else {
      newMessages.push(message);
    }
  }

  return newMessages;
};
