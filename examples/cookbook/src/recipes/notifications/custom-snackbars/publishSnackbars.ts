import type { StreamChat } from 'stream-chat';

/**
 * Publishes one snackbar of each kind the page shows. A notification without a panel tag goes to
 * the `channel` panel, so they stack over the open channel. Returns their ids.
 */
export const publishSnackbars = (client: StreamChat) => [
  client.notifications.addSuccess({
    message: 'Invite link copied',
    origin: { emitter: 'InviteButton' },
  }),
  client.notifications.addWarning({
    message: 'Photo is still uploading',
    origin: { emitter: 'SendButton' },
    options: {
      actions: [
        { handler: () => console.log('Send without the photo'), label: 'Send now' },
      ],
      // No duration, so it stays until the user acts on it or dismisses it.
      duration: 0,
      type: 'app:attachment:upload:pending',
    },
  }),
  client.notifications.addError({
    message: "Message couldn't be sent",
    origin: { emitter: 'SendButton' },
    options: { duration: 8000, type: 'app:message:send:failed' },
  }),
];
