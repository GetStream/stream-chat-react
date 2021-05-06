The MessageInputContext provides the following properties:

Values from the `useMessageInputState` hook.

- **attachments** Part of MessageInputState, array of attachments.

- **autocompleteTriggers** Default triggers for the ChatAutoComplete component.

- **emojiPickerIsOpen** Part of MessageInputState, whether the message input emoji picker is opened or not.

- **fileOrder** Part of MessageInputState, an array containing the keys of the non-image attachments attached to the message input.

- **fileUploads** Part of MessageInputState, an array containing the attachment objects of the attachments attached to the message input.

- **imageOrder** Part of MessageInputState, an array containing the keys of the images attached to the message input.

- **imageUploads** Part of MessageInputState, an array containing the image objects of the images attached to the message input.

- **mentioned_users** Part of MessageInputState, ids of users mentioned in message.

- **text** Part of MessageInputState, the current message input text.

- **closeEmojiPicker** Handler for the input event to close the emoji picker, receives a mouse event as a parameter.

- **emojiPickerRef** A reference to the DOM element containing the emoji picker when it is opened.

- **handleChange** Handles the message input change event, receiving it as its argument.

- **handleEmojiKeyDown** Handles the input handle keydown event, receiving KeyboardEventHandler as argument.

- **handleSubmit** Handles the message input form submit event, receiving it as its argument.

- **insertText** Function that handles the text to insert.

- **isUploadEnabled** For if uploads are enabled for the input.

- **maxFilesLeft** A number representing the difference between the max number of files and the amount currently updated.

- **numberOfUploads** Part of MessageInputState, the number of files currently attached to the message input.

- **onPaste** Handles the message input `paste` event, receiving it as its argument.

- **onSelectEmoji** Handles the addition of an emoji to the current message input.

- **onSelectUser** Handles the selection of a user from the mentions box. Receives a user object as its argument.

- **openEmojiPicker** Opens the emoji picker. It also handle the setting of event listeners to close the emoji picker on selection or clicking outside of it.

- **removeFile** A function for removing a file from the current message input. Receives the `file ID` as its argument.

- **removeImage** A function for removing an image from the current message input. Receives the `image ID` as its argument.

- **textareaRef** A reference to the message input textarea DOM.

- **uploadFile** Handles the upload of a file. Receives the `file ID` as its argument.

- **uploadImage** Handles the upload of an image. Receives the `image ID` as its argument.

- **uploadNewFiles** A function for handling the upload of new files. Receives a `FileList` as an argument.

- **emojiIndex** NimbleEmojiIndex from emoji-mart.

Values from the `useCooldownTimer` hook.

- **cooldownInterval** The length of the cooldown timer that is started after a user posts a message with slow mode turned on.

- **cooldownRemaining** Amount of time remaining for the current cooldown.

- **setCooldownRemaining** Function to set the cooldownInterval variable.

MessageInputContext also provides the [MessageInputProps](https://getstream.github.io/stream-chat-react/#messageinput) that were passed into the `MessageInputContextProvider` by the `MessageInput` component.