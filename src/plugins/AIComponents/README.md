# [React](https://getstream.io/chat/sdk/react/) AI components for Stream Chat

This official repository for Stream Chat's UI components is designed specifically for AI-first applications written in React. When paired with our real-time [Chat API](https://getstream.io/chat/), it makes integrating with and rendering responses from LLM providers such as ChatGPT, Gemini, Anthropic or any custom backend easier by providing rich with out-of-the-box components able to render Markdown, Code blocks, tables, streaming messages, file attachments, speech-to-text, etc.

To start, this library includes the following components which assist with this task:

- `AIMessageComposer` - a fully featured message composer with file attachments, speech-to-text, and model selection
- `AIMarkdown` - a markdown renderer optimized for AI-generated content with syntax highlighting and custom tool component support
- `StreamingMessage` - a component that displays text with a typewriter animation effect, ideal for streaming AI responses
- `SpeechToTextButton` - a button component for voice input using the Web Speech API

Our team plans to keep iterating and adding more components over time. If there's a component you use every day in your apps and would like to see added, please open an issue and we will take it into consideration.

## 🛠️ Installation

The `@stream-io/chat-react-ai` SDK is available on NPM.

To install it, you may run the following command:

```bash
npm install @stream-io/chat-react-ai
# or
pnpm add @stream-io/chat-react-ai
# or
yarn add @stream-io/chat-react-ai
```

## Styles

Import the base styles in your application:

```javascript
import '@stream-io/chat-react-ai/styles/index.css';
```

## ⚙️ Usage

All of the components listed below are designed to work seamlessly with our existing React [Chat SDK](https://getstream.io/chat/sdk/react/). Our [developer guide](https://getstream.io/chat/solutions/ai-integration/) explains how to get started building AI integrations with Stream.

## Components

### `AIMessageComposer`

The `AIMessageComposer` gives users a complete message composer component with support for text input, file attachments, speech-to-text, and model selection.

```tsx
import { AIMessageComposer } from '@stream-io/chat-react-ai';

function ChatComposer({ attachments }: ChatComposerProps) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    // Handle submission
  };

  return (
    <AIMessageComposer onSubmit={handleSubmit}>
      <AIMessageComposer.FileInput name="attachments" />
      <AIMessageComposer.TextInput name="message" />
      <AIMessageComposer.SpeechToTextButton />
      <AIMessageComposer.ModelSelect name="model" />
      <AIMessageComposer.SubmitButton />
      <AIMessageComposer.AttachmentPreview>
        {attachments.map((attachment) => (
          <AIMessageComposer.AttachmentPreview.Item {...attachment} />
        ))}
      </AIMessageComposer.AttachmentPreview>
    </AIMessageComposer>
  );
}
```

#### Sub-components

- **`AIMessageComposer.FileInput`** - File input button for attaching files. Supports multiple file selection.
- **`AIMessageComposer.TextInput`** - Text input field for typing messages. Automatically syncs with composer state.
- **`AIMessageComposer.SpeechToTextButton`** - Button to toggle speech-to-text input using the Web Speech API.
- **`AIMessageComposer.SubmitButton`** - Submit button for sending the message.
- **`AIMessageComposer.ModelSelect`** - Dropdown for selecting AI models. Customizable via `options` prop.
- **`AIMessageComposer.AttachmentPreview`** - Preview container for attached files.
- **`AIMessageComposer.AttachmentPreview.Item`** - Preview item component, renders a different look for file types that begin with `image/`.

#### Props

| Name                       | Type                                         | Required | Description                                                                                                                                                                                               |
| -------------------------- | -------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resetAttachmentsOnSelect` | `boolean`                                    | no       | Resets file input after selection. Defaults to `true`.                                                                                                                                                    |
| `nameMapping`              | `{ message?: string; attachments?: string }` | no       | Maps custom input names to internal state. By default, the composer expects inputs named `message` (for text) and `attachments` (for files). Use this prop to map different names to these internal keys. |
| `onSubmit`                 | `(e: FormEvent<HTMLFormElement>) => void`    | no       | Form submission handler.                                                                                                                                                                                  |
| `onChange`                 | `(e: FormEvent<HTMLFormElement>) => void`    | no       | Form change handler.                                                                                                                                                                                      |
|                            | `...HTMLFormElement props`                   | no       | Supports all standard HTML form element props.                                                                                                                                                            |

> [!NOTE]
> Some default input components come with default `name` attributes (`TextInput` defaults to `"message"`, `FileInput` defaults to `"attachments"`). You can override these names via props, and use the `nameMapping` prop to tell the composer how to map your custom names to its internal state.

### `AIMarkdown`

The `AIMarkdown` is a markdown renderer optimized for AI-generated content with syntax highlighting and custom tool component support.

#### Props

| Name                 | Type                 | Required | Description                                                  |
| -------------------- | -------------------- | -------- | ------------------------------------------------------------ |
| `children`           | `string`             | yes      | The markdown content to render.                              |
| `toolComponents`     | `ToolComponents`     | no       | Custom components for rendering tool outputs (e.g., charts). |
| `markdownComponents` | `MarkdownComponents` | no       | Custom markdown component overrides.                         |

#### Built-in Tool Components

- **`chartjs`** - Renders Chart.js visualizations from code blocks with `language-chartjs` or `language-json` if it matches supported Chart.js data schema.

#### Example

```tsx
import { AIMarkdown } from '@stream-io/chat-react-ai';

function MessageContent({ content }) {
  return <AIMarkdown>{content}</AIMarkdown>;
}
```

### `StreamingMessage`

The `StreamingMessage` is a component that displays text with a typewriter animation effect, similar to ChatGPT. It's ideal for streaming AI responses. It's a simplified wrapper with typewriter animation effect around `AIMarkdown` component.

#### Props

| Name   | Type     | Required | Description                                        |
| ------ | -------- | -------- | -------------------------------------------------- |
| `text` | `string` | yes      | The text content to display with streaming effect. |

#### Example

```tsx
import { StreamingMessage } from '@stream-io/chat-react-ai';

function AIResponse({ text }) {
  return <StreamingMessage text={text} />;
}
```

### `SpeechToTextButton`

The `SpeechToTextButton` is a button component for voice input using the Web Speech API. It provides a simple interface for converting speech to text with built-in microphone icon and listening state visualization.

#### Props

| Name      | Type                         | Required | Description                                                                                                                      |
| --------- | ---------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `options` | `UseSpeechToTextOptions`     | no       | Options for speech recognition (see `useSpeechToText` hook documentation for available options like `lang`, `continuous`, etc.). |
|           | `...HTMLButtonElement props` | no       | Supports all standard HTML button element props.                                                                                 |

#### Example

```tsx
import { SpeechToTextButton } from '@stream-io/chat-react-ai';

function VoiceInputButton() {
  return (
    <SpeechToTextButton
      options={{
        lang: 'en-US',
        continuous: false,
        interimResults: true,
      }}
    />
  );
}
```

> [!NOTE]
> When used within an `AIMessageComposer`, the button automatically updates the composer's text input. When used standalone, you can control the behavior through the `speechToTextOptions.onTranscript` callback.

### `AttachmentPreview`

A container component for displaying file attachment previews with support for images and documents.

#### AttachmentPreview.Item Props

| Name                 | Type                                                 | Required | Description                                   |
| -------------------- | ---------------------------------------------------- | -------- | --------------------------------------------- |
| `file`               | `File`                                               | yes      | The file object to preview.                   |
| `state`              | `'uploading' \| 'finished' \| 'failed' \| 'pending'` | no       | Upload state indicator.                       |
| `title`              | `string`                                             | no       | Custom title (defaults to filename).          |
| `imagePreviewSource` | `string`                                             | no       | Custom image preview URL.                     |
| `onDelete`           | `(e: MouseEvent) => void`                            | no       | Delete button handler.                        |
| `onRetry`            | `(e: MouseEvent) => void`                            | no       | Retry button handler (shown on failed state). |

#### Example

```tsx
import { AIMessageComposer } from '@stream-io/chat-react-ai';

function CustomAttachmentPreview({
  attachments,
}: CustomAttachmentPreviewProps) {
  return (
    <AIMessageComposer.AttachmentPreview>
      {attachments.map((attachment) => (
        <AIMessageComposer.AttachmentPreview.Item
          key={attachment.id}
          file={attachment.file}
          onDelete={() => removeAttachment(attachment.id)}
        />
      ))}
    </AIMessageComposer.AttachmentPreview>
  );
}
```

## Hooks

### `useAttachments` (experimental)

Manage attachments within the composer context. **Must be used within an `AIMessageComposer` component.**

#### Returns

| Name                | Type                                                            | Description                 |
| ------------------- | --------------------------------------------------------------- | --------------------------- |
| `attachments`       | `Array<{ id: string; file: File; meta?: Record<string, any> }>` | Current attachments.        |
| `removeAttachment`  | `(idOrFile: string \| File) => void`                            | Remove an attachment.       |
| `updateAttachments` | `(ids: Array<string \| Attachment>, updater: Function) => void` | Update attachment metadata. |

#### Example

```tsx
import { useAttachments } from '@stream-io/chat-react-ai';

function AttachmentManager() {
  const { attachments, removeAttachment, updateAttachments } = useAttachments();

  const manageAttachment = (attachmentId: string) => {
    // Update attachment metadata
    updateAttachments([attachmentId], (attachment) => ({
      ...attachment,
      meta: { uploaded: true },
    }));

    // Remove an attachment by id or file
    removeAttachment(attachmentId);
  };

  return <div>{attachments.length} files attached</div>;
}
```

> ![NOTE]
> While this attachment API works it's highly recommended to use own attachment API or the one provided by the `stream-chat-react`/`stream-chat`.

### `useText`

Access and update the text input value. **Must be used within an `AIMessageComposer` component.**

#### Returns

| Name      | Type                     | Description         |
| --------- | ------------------------ | ------------------- |
| `text`    | `string`                 | Current text value. |
| `setText` | `(text: string) => void` | Update text value.  |

#### Example

```tsx
import { useText } from '@stream-io/chat-react-ai';

function CustomTextDisplay() {
  const { text, setText } = useText();

  return (
    <div>
      <p>Current text: {text}</p>
      <button onClick={() => setText('New text')}>Update</button>
    </div>
  );
}
```

### `useMessageTextStreaming`

Create a typewriter streaming effect for text content. Useful when you require a custom implementation of a `StreamingMessage` component.

#### Props

| Name                        | Type     | Required | Description                                                 |
| --------------------------- | -------- | -------- | ----------------------------------------------------------- |
| `text`                      | `string` | yes      | The full text to stream.                                    |
| `streamingLetterIntervalMs` | `number` | no       | Interval between character updates. Defaults to `30`.       |
| `renderingLetterCount`      | `number` | no       | Number of characters to render per update. Defaults to `2`. |

#### Returns

| Name                  | Type     | Description                          |
| --------------------- | -------- | ------------------------------------ |
| `streamedMessageText` | `string` | Currently displayed portion of text. |

#### Example

```tsx
import { useMessageTextStreaming } from '@stream-io/chat-react-ai';

function StreamedText({ fullText }) {
  const { streamedMessageText } = useMessageTextStreaming({
    text: fullText,
    streamingLetterIntervalMs: 30,
    renderingLetterCount: 2,
  });

  return <div>{streamedMessageText}</div>;
}
```

### `useSpeechToText`

Enable voice input using the Web Speech API. Provides speech recognition capabilities with real-time transcription.

#### Props

| Name              | Type                      | Required | Description                                                                         |
| ----------------- | ------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `lang`            | `string`                  | no       | Language for speech recognition (e.g., 'en-US', 'es-ES'). Defaults to `'en-US'`.    |
| `interimResults`  | `boolean`                 | no       | Whether to return interim (partial) results. Defaults to `true`.                    |
| `maxAlternatives` | `number`                  | no       | Maximum number of alternative transcriptions. Defaults to `1`.                      |
| `continuous`      | `boolean`                 | no       | Whether recognition should continue after user stops speaking. Defaults to `false`. |
| `onTranscript`    | `(text: string) => void`  | no       | Callback when transcription text changes.                                           |
| `onError`         | `(error: string) => void` | no       | Callback when an error occurs.                                                      |

#### Returns

| Name             | Type         | Description                                             |
| ---------------- | ------------ | ------------------------------------------------------- |
| `isListening`    | `boolean`    | Whether speech recognition is currently active.         |
| `isSupported`    | `boolean`    | Whether the Web Speech API is supported in the browser. |
| `startListening` | `() => void` | Start speech recognition.                               |
| `stopListening`  | `() => void` | Stop speech recognition.                                |

#### Example

```tsx
import { useSpeechToText } from '@stream-io/chat-react-ai';

function VoiceInput() {
  const [transcript, setTranscript] = useState('');

  const { isListening, isSupported, startListening, stopListening } =
    useSpeechToText({
      lang: 'en-US',
      interimResults: true,
      onTranscript: (text) => setTranscript(text),
      onError: (error) => console.error('Speech recognition error:', error),
    });

  if (!isSupported) {
    return <div>Speech recognition is not supported in your browser</div>;
  }

  return (
    <div>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? 'Stop' : 'Start'} Recording
      </button>
      <p>Transcript: {transcript}</p>
    </div>
  );
}
```

## Examples

### Basic Chat Interface

```tsx
import { AIMessageComposer } from '@stream-io/chat-react-ai';
import '@stream-io/chat-react-ai/styles/index.css';

function ChatInterface() {
  const [attachments, setAttachments] = useState([]);

  const handleChange = (e) => {
    const input = e.currentTarget.elements.namedItem(
      'attachments',
    ) as HTMLInputElement | null;

    const files = input?.files ?? null;

    if (files) {
      // Send to your API
      uploadFiles(files).then((uploadedAttachments) =>
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...uploadedAttachments,
        ]),
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const message = formData.get('message');

    // Send to your API
    await sendMessage({ message });

    // Reset form
    e.target.reset();
  };

  return (
    <AIMessageComposer onChange={handleChange} onSubmit={handleSubmit}>
      <AIMessageComposer.AttachmentPreview>
        {attachments.map((attachment) => (
          <AIMessageComposer.AttachmentPreview.Item {...attachment} />
        ))}
      </AIMessageComposer.AttachmentPreview>
      <AIMessageComposer.FileInput name="attachments" />
      <AIMessageComposer.TextInput name="message" />
      <AIMessageComposer.SpeechToTextButton />
      <AIMessageComposer.ModelSelect name="model" />
      <AIMessageComposer.SubmitButton />
    </AIMessageComposer>
  );
}
```

### Custom Markdown Rendering

```tsx
import { AIMarkdown } from '@stream-io/chat-react-ai';

const customComponents = {
  h1: ({ children }) => <h1 className="custom-heading">{children}</h1>,
  code: ({ children }) => (
    <AIMarkdown.default.code className="custom-class">
      {children}
    </AIMarkdown.default.code>
  ),
};

const customToolComponents = {
  weather: ({ data, fallback }) => {
    try {
      const parsedData = JSON.parse(data);
      return <div className="weather-tool">{parsedData.result}</div>;
    } catch {
      return fallback;
    }
  },
};

function CustomMarkdown({ content }) {
  return (
    <AIMarkdown
      markdownComponents={customComponents}
      toolComponents={customToolComponents}
    >
      {content}
    </AIMarkdown>
  );
}
```

### Streaming AI Response

```tsx
import { StreamingMessage } from '@stream-io/chat-react-ai';

function AIResponseStream({ response }) {
  return (
    <div className="ai-response">
      <StreamingMessage text={response} />
    </div>
  );
}
```

<br />

<a href="https://getstream.io?utm_source=Github&utm_medium=Github_Repo_Content&utm_content=Developer&utm_campaign=Github_React_AI_SDK&utm_term=DevRelOss">
<img src="https://user-images.githubusercontent.com/24237865/138428440-b92e5fb7-89f8-41aa-96b1-71a5486c5849.png" align="right" width="12%"/>
</a>

## 🛥 What is Stream?

Stream allows developers to rapidly deploy scalable feeds, chat messaging and video with an industry leading 99.999% uptime SLA guarantee.

Stream provides UI components and state handling that make it easy to build real-time chat and video calling for your app. Stream runs and maintains a global network of edge servers around the world, ensuring optimal latency and reliability regardless of where your users are located.

## 📕 Tutorials

To learn more about integrating AI and chatbots into your application, we recommend checking out the full list of tutorials across all of our supported frontend SDKs and providers. Stream's Chat SDK is natively supported across:

- [React](https://getstream.io/chat/react-chat/tutorial/)
- [React Native](https://getstream.io/chat/react-native-chat/tutorial/)
- [Angular](https://getstream.io/chat/angular/tutorial/)
- [Jetpack Compose](https://getstream.io/tutorials/android-chat/)
- [SwiftUI](https://getstream.io/tutorials/ios-chat/)
- [Flutter](https://getstream.io/chat/flutter/tutorial/)
- [Javascript/Bring your own](https://getstream.io/chat/docs/javascript/)

## 👩‍💻 Free for Makers 👨‍💻

Stream is free for most side and hobby projects. To qualify, your project/company needs to have < 5 team members and < $10k in monthly revenue. Makers get $100 in monthly credit for video for free.
For more details, check out the [Maker Account](https://getstream.io/maker-account?utm_source=Github&utm_medium=Github_Repo_Content&utm_content=Developer&utm_campaign=Github_React_AI_SDK&utm_term=DevRelOss).

## 💼 We are hiring!

We've closed a [\$38 million Series B funding round](https://techcrunch.com/2021/03/04/stream-raises-38m-as-its-chat-and-activity-feed-apis-power-communications-for-1b-users/) in 2021 and we keep actively growing.
Our APIs are used by more than a billion end-users, and you'll have a chance to make a huge impact on the product within a team of the strongest engineers all over the world.
Check out our current openings and apply via [Stream's website](https://getstream.io/team/#jobs).

## License

```
Copyright (c) 2014-2024 Stream.io Inc. All rights reserved.

Licensed under the Stream License;
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   https://github.com/GetStream/ai-js/blob/main/LICENSE

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
