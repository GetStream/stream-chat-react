The MessageContext provides the following properties:

- **actionsEnabled** If actions such as edit, delete, flag, mute are enabled on Message

- **clearEditingState** Function to exit edit state

- **editing** If the Message is in edit state

- **getMessageActions** Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'pin', 'react', 'reply']. Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.tsx) component for default implementation.

- **handleAction** Function to send an action in a Channel

- **handleDelete** Function to delete a message in a Channel

- **handleEdit** Function to edit a message in a Channel

- **handleFlag** Function to flag a message in a Channel

- **handleMute** Function to mute a user in a Channel

- **handleOpenThread** Function to open a Thread on a Message

- **handlePin** Function to pin a Message in a Channel

- **handleReaction** Function to post a reaction on a Message

- **handleRetry** Function to retry sending a Message

- **isMyMessage** Function that returns whether or not the Message belongs to the current user

- **isReactionsEnabled** Whether or not reactions are enabled for the active channel

- **message** The message object

- **onMentionsClickMessage** Handler function for a click event on an @mention in Message

- **onMentionsHoverMessage** Handler function for a hover event on an @mention in Message

- **onReactionListClick** Handler function for a click event on the Reactions List.

- **onUserClick** Handler function for a click event on the user that posted the Message

- **onUserHover** Handler function for a hover event on the user that posted the Message

- **reactionsSelectorRef** Handler function for a click event on the reaction list

- **setEditingState** Function to toggle the edit state on a Message

- **showDetailedReactions** Whether or not to show reaction list details

- **additionalMessageInputProps** Additional props for underlying MessageInput component, [Available props](https://getstream.github.io/stream-chat-react/#messageinput)

- **channelConfig** Channel config object

- **formatDate** Override the default formatting of the date. This is a function that has access to the original date object, returns a string

- **groupStyles** A list of styles to apply to this message, ie. top, bottom, single

- **initialMessage** Whether the threaded message is the first in the thread list

- **lastReceivedId** Latest message id on current channel

- **messageListRect** DOMRect object for parent MessageList component

- **mutes** Array of muted users coming from [ChannelStateContext](https://getstream.github.io/stream-chat-react/#section-channelstatecontext)

- **pinPermissions** The user roles allowed to pin Messages in various channel types

- **readBy** A list of users that have read this Message

- **renderText** Custom function to render message text content, defaults to the renderText function: [utils](https://github.com/GetStream/stream-chat-react/blob/master/src/utils.ts)

- **threadList** Whether or not the Message is in a Thread

- **unsafeHTML** render HTML instead of markdown. Posting HTML is only allowed server-side
