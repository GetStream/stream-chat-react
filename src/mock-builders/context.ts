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

export const mockChatContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<ChatContextValue>({
    theme: 'messaging light',
    ...overrides,
  });

export const mockChannelStateContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<ChannelStateContextValue>(overrides);

export const mockChannelActionContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<ChannelActionContextValue>(overrides);

export const mockTranslationContextValue = (overrides: Record<string, unknown> = {}) =>
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

export const mockComponentContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<ComponentContextValue>(overrides);

export const mockMessageContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<MessageContextValue>(overrides);

export const mockMessageListContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<MessageListContextValue>(overrides);

export const mockTypingContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<TypingContextValue>(overrides);

export const mockChannelListContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<ChannelListContextValue>(overrides);
