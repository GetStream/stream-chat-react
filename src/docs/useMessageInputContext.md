A custom hook that consumes the MessageInputContext that is provided by the `MessageInput` component. Its return values are comprised of the props passed into the `MessageInput` component, the values returned by the `useMessageInputState` hook and the values returned by the `useCooldownTimer` hook. Returns all functions needed to customize and build your custom Input components.

The table below describes most of the hook's return values, but be aware that the hook also returns the [MessageInputProps](https://getstream.github.io/stream-chat-react/#messageinput) that were passed into the `MessageInputContextProvider` by the `MessageInput` component.

| Returns   | Type | Description                                           |
| --------- | ---- | ----------------------------------------------------- |
|  `attachments` | array | Part of MessageInputState, array of attachments.
|  `closeEmojiPicker`| func | Handler for the input event to close the emoji picker, receives a mouse event as a parameter.
|  `cooldownInterval`| number | The length of the cooldown timer that is started after a user posts a message with slow mode turned on.
|  `cooldownRemaining`| number | Amount of time remaining for the current cooldown.
|  `emojiIndex` | object | NimbleEmojiIndex from emoji-mart.
|  `emojiPickerIsOpen` | boolean | Part of MessageInputState, whether the message input emoji picker is opened or not.
|  `emojiPickerRef` | object | A reference to the DOM element containing the emoji picker when it is opened.
|  `fileOrder` | array | Part of MessageInputState, an array containing the keys of the non-image attachments attached to the message input.
|  `fileUploads` | array | Part of MessageInputState, an array containing the attachment objects of the attachments attached to the message input
|  `handleChange` | func | Handles the message input change event, receiving it as its argument.
|  `handleEmojiKeyDown` | func | Handles the input handle keydown event, receiving KeyboardEventHandler as argument.
|  `handleSubmit` | func | Handles the message input form submit event, receiving it as its argument.
|  `imageOrder` | array | Part of MessageInputState, an array containing the keys of the images attached to the message input.
|  `imageUploads` | array | Part of MessageInputState, an array containing the image objects of the images attached to the message input.
|  `insertText` | func | Function that handles the text to insert.
|  `isUploadEnabled` | boolean | For if uploads are enabled for the input.
|  `maxFilesLeft` | number | A number representing the difference between the max number of files and the amount currently updated
|  `mentioned_users` | array | Part of MessageInputState, ids of users mentioned in message.
|  `numberOfUploads` | number | Part of MessageInputState, the number of files currently attached to the message input.
|  `onPaste` | func | Handles the message input `paste` event, receiving it as its argument.
|  `onSelectEmoji` | func | Handles the addition of an emoji to the current message input.
|  `onSelectUser` | func | Handles the selection of a user from the mentions box. Receives a user object as its argument.                           
|  `openEmojiPicker` | func | Opens the emoji picker. It also handle the setting of event listeners to close the emoji picker on selection or clicking outside of it.
|  `removeFile` | func | A function for removing a file from the current message input. Receives the `file ID` as its argument.
|  `removeImage` | func | A function for removing an image from the current message input. Receives the `image ID` as its argument.
|  `text` | string | Part of MessageInputState, the current message input text.
|  `textareaRef` | object | A reference to the message input textarea DOM.
|  `uploadFile` | func | Handles the upload of a file. Receives the `file ID` as its argument.
|  `uploadImage` | func | Handles the upload of an image. Receives the `image ID` as its argument.
|  `uploadNewFiles` | func | A function for handling the upload of new files. Receives a `FileList` as an argument.