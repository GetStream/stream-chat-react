The ComponentContext provides the following properties:

- **Avatar** Custom UI component to display attachment in individual message, defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.tsx)

- **Avatar** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx)

- **DateSeparator** Custom UI component to display the date separator, defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator/DateSeparator.tsx)

- **EditMessageInput** Custom UI component to display user avatar, defaults to and accepts same props as: [EditMessageInput](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.tsx)

- **Emoji** Custom UI component to override default NimbleEmoji from emoji-mart.

- **EmojiIndex** Custom UI component to override default NimbleEmojiIndex from emoji-mart.

- **EmojiPicker** Custom UI component to override default NimblePicker from emoji-mart.

- **Message** Custom UI component to display a message in message list. Available built-in components (also accepts the same props as):
  * [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageSimple.tsx) (default)
  * [MessageTeam](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageTeam.tsx)
  * [MessageLivestream](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageLivestream.tsx)
  * [MessageCommerce](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageCommerce.tsx)

- **HeaderComponent** Component to render at the top of the MessageList

- **MessageDeleted** Custom UI component for a deleted message, defaults to and accepts same props as: [MessageDeleted](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageDeleted.tsx)

- **MessageOptions** Custom UI component for message options popup, defaults to and accepts same props as: [MessageOptions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageOptions.tsx)

- **MessageRepliesCountButton** Custom UI component to display message replies, defaults to and accepts same props as: [MessageRepliesCountButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageRepliesCountButton.tsx)

- **MessageSystem** Custom UI component to display system messages, defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent.tsx)

- **MessageTimestamp** Custom UI component to display a timestamp on a message, defaults to and accepts same props as: [MessageTimestamp](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageTimestamp.tsx)

- **PinIndicator** Custom UI component to override default pinned message indicator, defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icons.tsx)

- **ReactionSelector** Custom UI component to display the reaction selector, defaults to and accepts same props as: [ReactionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionSelector.tsx)

- **ReactionsList** Custom UI component to display the list of reactions on a message, defaults to and accepts same props as: [ReactionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsList.tsx)