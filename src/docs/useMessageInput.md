A custom hook that provides all functionality to the Input it renders. Returns all functions needed to customize and build your custom Input components.

Accepts the [MessageInputProps](https://getstream.github.io/stream-chat-react/#messageinput).

| Returns   | Type | Description                                           |
| --------- | ---- | ----------------------------------------------------- |
|  `attachments` | array | Part of MessageInputState, array of attachments.
|  `closeEmojiPicker`| func | Handler for the input event to close the emoji picker, receives a mouse event as a parameter.
|  `emojiPickerIsOpen` | boolean | Part of MessageInputState, whether the message input emoji picker is opened or 
|  `emojiPickerRef` | object | A reference to the DOM element containing the emoji picker when it is opened.
|  `fileOrder` | array | Part of MessageInputState, an array containing the keys of the non-image attachments attached to the message input.
|  `fileUploads` | array | Part of MessageInputState, an array containing the attachment objects of the attachments attached to the message input
|  `getCommands` | func | Handler to get commands from the currently active `channel`, returns an array of commands.
|  `getUsers` | func | Handler to get the users from the currently active `channel` state.
|  `handleChange` | func | Handles the message input change event, receiving it as its argument.
|  `handleEmojiKeyDown` | func | Handles the input handle keydown event, receiving KeyboardEventHandler as argument.
|  `handleSubmit` | func | Handles the message input form submit event, receiving it as its argument.
|  `imageOrder` | array | Part of MessageInputState, an array containing the keys of the images attached to the message input.
|  `imageUploads` | array | Part of MessageInputState, an array containing the image objects of the images attached to the message input.
|  `isUploadEnabled` | boolean | For if uploads are enabled for the input.
|  `maxFilesLeft` | number | A number representing the difference between the max number of files and the amount currently updated
|  `mentioned_users` | array | Part of MessageInputState, ids of users mentioned in message.
|  `numberOfUploads` | number | Part of MessageInputState, the number of files currently attached to the message input.
|  `onPaste` | func | Handles the message input `paste` event, receiving it as its argument.
|  `onSelectEmoji` | func | Handles the addition of an emoji to the current message input.
|  `onSelectItem` | func | Handles the selection of a user from the mentions box. Receives a user object as its argument.                           
|  `openEmojiPicker` | func | Opens the emoji picker. It also handle the setting of event listeners to close the emoji picker on selection or clicking outside of it.
|  `removeFile` | func | A function for removing a file from the current message input. Receives the `file ID` as its argument.
|  `removeImage` | func | A function for removing an image from the current message input. Receives the `image ID` as its argument.
|  `text` | string | art of MessageInputState, the current message input text.
|  `textareaRef` | object | A reference to the message input textarea DOM.
|  `uploadFile` | func | Handles the upload of a file. Receives the `file ID` as its argument.
|  `uploadImage` | func | Handles the upload of an image. Receives the `image ID` as its argument.
|  `uploadNewFiles` | func | A function for handling the upload of new files. Receives a `FileList` as an argument.