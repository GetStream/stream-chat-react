import { fromPartial } from '@total-typescript/shoehorn';
import type {
  ChannelActionContextValue,
  ChannelListContextValue,
  ChannelStateContextValue,
  ChatContextValue,
  ComponentContextValue,
  MessageContextValue,
  MessageListContextValue,
  TranslationContextValue,
  TypingContextValue,
} from '../context';

export const mockChatContext = (overrides: Partial<ChatContextValue> = {}) =>
  fromPartial<ChatContextValue>({
    theme: 'messaging light',
    ...overrides,
  });

export const mockChannelStateContext = (
  overrides: Partial<ChannelStateContextValue> = {},
) => fromPartial<ChannelStateContextValue>(overrides);

export const mockChannelActionContext = (
  overrides: Partial<ChannelActionContextValue> = {},
) => fromPartial<ChannelActionContextValue>(overrides);

export const mockTranslationContextValue = (
  overrides: Partial<TranslationContextValue> = {},
) =>
  fromPartial<TranslationContextValue>({
    t: ((key: string) => key.split('/').pop()) as TranslationContextValue['t'],
    tDateTimeParser: ((input: any) => ({
      calendar: () => String(input),
      format: () => String(input),
      fromNow: () => String(input),
      isSame: () => false,
    })) as any,
    userLanguage: 'en',
    ...overrides,
  });

export const mockComponentContext = (overrides: Partial<ComponentContextValue> = {}) =>
  fromPartial<ComponentContextValue>(overrides);

export const mockMessageContext = (overrides: Partial<MessageContextValue> = {}) =>
  fromPartial<MessageContextValue>(overrides);

export const mockMessageListContext = (
  overrides: Partial<MessageListContextValue> = {},
) => fromPartial<MessageListContextValue>(overrides);

export const mockTypingContext = (overrides: Partial<TypingContextValue> = {}) =>
  fromPartial<TypingContextValue>(overrides);

export const mockChannelListContext = (
  overrides: Partial<ChannelListContextValue> = {},
) => fromPartial<ChannelListContextValue>(overrides);
