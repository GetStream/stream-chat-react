The MessageInput is a higher level component that has provides all functionality to the Input it renders. In this example it renders the default component MessageInputLarge.

It provides following functions to underlying UI component:

- **uploadNewFiles** Upload a new file or image

  _Params_

  - `files` Array of File objects to upload

- **removeImage**

  _Params_

  - `id` Index of image in `imageUploads` array in state of MessageInput.

- **uploadImage** Used to retry image upload, in-case it fails the first time.

  _Params_

  - `id` Index of image in `imageUploads` array in state of MessageInput

- **removeFile**

  _Params_

  - `id` Index of file in `fileUploads` array in state of MessageInput

- **uploadFile** Used to retry file upload, in-case it fails the first time.

  _Params_

  - `id` Index of image in `fileUploads` array in state of MessageInput

- **onSelectEmoji** Handler when emoji is selected from emoji-picker. We use [emoji-mart](https://github.com/missive/emoji-mart) to generate emoji picker.

  _Params_

  - `emoji` [Emoji object](https://github.com/missive/emoji-mart#examples-of-emoji-object)

- **getUsers** Returns all users (members + watchers) in current channel
- **getCommands** Returns all commands available on current channel (specified in channel config).
- **handleSubmit** Handler for submit action on input form (in UI input component)

  _Params_

  - `event` [Submit](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) event of form

- **handleChange** Handler for text change in input form

  _Params_

  - `event` [Change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) event of form

- **onPaste** Handler for paste action through browser's UI.

  _Params_

  - `event` [Paste](https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event) event.

- **onSelectItem** Handler for selecting item from mentions suggestions list.

  _Params_

  `item` Target user object.

- **openEmojiPicker** - Handler to open emoji picker.

It provides following state values as well:

- **emojiPickerRef**
- **panelRef**
- **textareaRef**
- **text** Current text in input box
- **attachments** Array of [attachments](https://getstream.io/chat/docs/#message_format) in message
- **imageOrder** Array of ids of objects in `imageUploads` array in sequence in which they were uploaded
- **imageUploads** Its an object/map of id vs image objects which are set for upload. It has following structure:

  ```json
    {
      "randomly_generated_temp_id_1": {
          "id": "randomly_generated_temp_id_1",
          "file": // File object
          "status": "Uploading" // or "Finished"
        },
      "randomly_generated_temp_id_2": {
          "id": "randomly_generated_temp_id_2",
          "file": // File object
          "status": "Uploading" // or "Finished"
        },
    }
  ```

- **fileOrder** Array of ids of objects in `fileUploads` array in sequence in which they were uploaded
- **fileUploads** Its an object/map of id vs file objects which are set for upload. It has following structure:

  ```json
    {
      "randomly_generated_temp_id_1": {
          "id": "randomly_generated_temp_id_1",
          "file": // File object
          "status": "Uploading" // or "Finished"
        },
      "randomly_generated_temp_id_2": {
          "id": "randomly_generated_temp_id_2",
          "file": // File object
          "status": "Uploading" // or "Finished"
        },
    }
  ```

- **emojiPickerIsOpen**
- **filePanelIsOpen**
- **mentioned_users** Array of users mentioned in message text.
- **numberOfUploads** Total number of uploads (image + file)

### Overriding Core Functions

Sometimes you'll want to use our components but will need custom functionality. Right now we support overriding the uploading of files and images. MessageInput takes two props to makes this possible:

- `onFileUploadRequest(file, channel)`
- `onImageUploadRequest(file, channel)`

Both functions have access to the selected file and the channel object and expect an object to be returned `{file: url}`.

### Allowed markdown in messages;

- paragraph
- emphasis
- strong
- link
- list
- code blocks
- inline code
- blockquote
- strikethrough

```js
import { Chat, Channel, MessageTeam, MessageInput } from '../components';

const data = require('./data');
<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client} Message={MessageTeam}>
    <Channel channel={data.channel}>
      <MessageInput />
    </Channel>
  </Chat>
</div>;
```
