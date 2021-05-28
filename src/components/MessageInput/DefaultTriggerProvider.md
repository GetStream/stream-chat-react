The MessageInput component exposes a `TriggerProvider` prop, which defaults to the `DefaultTriggerProvider` component.
This component is responsible for injecting the default set of triggers into the `autocompleteTriggers` value of the `MessageInputContext`.
This value is then consumed by the `ChatAutocomplete` component and its children to make sure the default triggers
(@mentions, /commands and :emojis) work as expected.

By injecting a custom `TriggerProvider` component, you can override the behavior of any of these triggers, or add your own custom trigger.
Here's an example of a customer `TriggerProvider` that only provides a custom trigger bound to the `#` character:

```typescript
import React from 'react';
import { MessageInput } from './MessageInput';
import {
  MessageInputContextProvider,
  useMessageInputContext,
} from '../../context/MessageInputContext';
import type { TriggerSetting } from '../ChatAutoComplete/ChatAutoComplete';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

const options = ['some', 'thing', 'that', 'totally', 'works'];

type CustomTriggerData = {
  name: string;
};

type CustomSuggestionItemProps = {
  entity: CustomTriggerData;
};

type CustomTriggerType = TriggerSetting<CustomSuggestionItemProps, CustomTriggerData>;

type CustomTriggers = {
  '#': {
    componentProps: CustomSuggestionItemProps;
    data: CustomTriggerData;
  };
};

const CustomSuggestionItem = (props: CustomSuggestionItemProps) => <div>{props.entity.name}</div>;

const customTrigger: CustomTriggerType = {
  component: CustomSuggestionItem,
  dataProvider: (query: string, _, onReady) => {
    const filteredOptions = options
      .filter((option) => option.includes(query))
      .map((option) => ({ name: option }));
    onReady(filteredOptions, query);
  },
  output: (entity) => ({
    caretPosition: 'next',
    key: entity.name,
    text: entity.name,
  }),
};

const customTriggers = {
  '#': customTrigger,
};

export const CustomTriggerProvider = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({ children }: React.PropsWithChildren<Record<string, unknown>>) => {
  const currentContext = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

  const newContext = {
    ...currentContext,
    autocompleteTriggers: customTriggers,
  };

  return (
    <MessageInputContextProvider<At, Ch, Co, Ev, Me, Re, Us, CustomTriggers> value={newContext}>
      {children}
    </MessageInputContextProvider>  
  );
};

// example of how you'd use this custom TriggerProvider as a prop on MessageInput:
export const MessageInputWithCustomTrigger = () => (
  <MessageInput TriggerProvider={CustomTriggerProvider} />
);
```

