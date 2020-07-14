Together with the MessageInput Components, we also provide a custom Hook to allow for easier customization of functional message input components.

| Parameter               | Type                                                     | Description                                                                                                                                         |
| ----------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`               | [object](https://getstream.io/chat/docs/#message_format) | The message object, when editing a message.                                                                                                         |
| `clearEditingState`     | func                                                     | A function triggered after the input submits a message edition succesfully.                                                                         |
| `noFiles`               | boolean                                                  | If true, file uploads are disabled. Defaults to `false`.                                                                                            |
| `doImageUploadRequest`  | promise                                                  | A `promise` triggered when a message with image attachments is sent. The `promise` is passed the image file and the channel as parameters.          |
| `doFileUploadRequest`   | promise                                                  | A `promise` triggered when a message with non-image attachments is sent. The `promise` is passed the attachment file and the channel as parameters. |
| `errorHandler`          | func                                                     | Custom error handler, called when file/image uploads fail.                                                                                          |
| `overrideSubmitHandler` | promise                                                  | When defined, will override the default message submit handler.                                                                                     |
| `parent`                | [object](https://getstream.io/chat/docs/#message_format) | The parent message object, when replying on a thread.                                                                                               |
| `publishTypingEvent`    | boolean                                                  | Enable/disable firing the typing event.                                                                                                             |

The **useMessageInputState** custom handler return an object containing the following properties:

| Properties          | Type    | Description                                                                                                                                                                |
| ------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`              | string  | The current message input text                                                                                                                                             |
| `imageOrder`        | array   | An array containing the keys of the images attached to the message input                                                                                                   |
| `imageUploads`      | array   | An array containing the image objects of the images attached to the message input                                                                                          |
| `fileOrder`         | array   | An array containing the keys of the non-image attachments attached to the message input                                                                                    |
| `fileUploads`       | array   | An array containing the attachment objects of the attachments attached to the message input                                                                                |
| `numberOfUploads`   | number  | The number of files currently attached to the message input                                                                                                                |
| `mentioned_users`   | array   | An array of objects containing the users currently mentioned on the message                                                                                                |
| `emojiPickerIsOpen` | boolean | Whether the message input emoki picker is opened or not                                                                                                                    |
| `textareaRef`       | object  | A reference to the message input textarea DOM element                                                                                                                      |
| `emojiPickerRef`    | object  | A reference to the DOM element containing the emoji picker when it is opened                                                                                               |
| `uploadNewFiles`    | func    | A function for handling the upload of new files. Receives a `FileList` as an argument.                                                                                     |
| `removeImage`       | func    | A function for removing an image from the current message input. Receives the `image ID` as its argument.                                                                  |
| `uploadImage`       | func    | Handles the upload of an image. Receives the `image ID` as its argument.                                                                                                   |
| `removeFile`        | func    | A function for removing a file from the current message input. Receives the `file ID` as its argument.                                                                     |
| `uploadFile`        | func    | Handles the upload of a file. Receives the `file ID` as its argument.                                                                                                      |
| `onSelectEmoji`     | func    | Handles the addition of an emoji to the current message input. Receives an [emoji object](https://github.com/missive/emoji-mart#examples-of-emoji-object) as its argument. |
| `handleSubmit`      | func    | Handles the message input form `submit` event, receiving it as its argument.                                                                                               |
| `handleChange`      | func    | Handles the message input `change` event, receiving it as its argument.                                                                                                    |
| `onPaste`           | func    | Handles the message input `paste` event, receiving it as its argument.                                                                                                     |
| `onSelectItem`      | func    | Handles the selection of a user from the mentions box. Receives a user object as its argument.                                                                             |
| `openEmojiPicker`   | func    | Opent the emoji picker. It also handle the setting of event listeners to close the emoji picker on selection or clicking outside of it.                                    |
