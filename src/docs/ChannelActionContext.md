The ChannelActionContext provides the following properties:

- **closeThread** The function to close the currently open Thread. This function should be attached to close button on Thread UI
- **dispatch** 
- **editMessage** A Function that takes a Message to be edited
-  **loadMore** The function to load next page/batch of messages (used for pagination) and the next batch of results will be available in `messages` object in ChannelContext
-  **loadMoreThread** The function to load next page/batch of messages in a currently active/open Thread (used for pagination)
-  **onMentionsClick** The function to execute when @mention is clicked in message, takes a DOM click event object and an array of mentioned users
-  **onMentionsHover** The function to execute when @mention is hovered on message, takes a DOM click event object and an array of mentioned users
-  **openThread** The function to execute when replies count button is clicked, takes the parent message of thread which needs to be opened and DOM click event
-  **removeMessage** The function to remove a message from MessageList, handled by the Channel component. Takes a [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript)
-  **retrySendMessage** The function to resend a message, handled by the Channel component. Takes a [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript)
-  **sendMessage** The function to send a message on channel, takes a [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript)
-  **updateMessage** The function to update a message on channel, takes a [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript)