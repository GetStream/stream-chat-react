import { fromPartial } from '@total-typescript/shoehorn';
import { mockT } from './translator';
import type {
  ChannelListContextValue,
  ChatContextValue,
  ComponentContextValue,
  MessageContextValue,
  MessageListContextValue,
  TranslationContextValue,
} from '../context';
import type { TDateTimeParser } from '../i18n/types';

// Overrides are `Record<string, unknown>`, not `Partial<ContextValue>`: mock `t` functions cannot
// satisfy i18next's `TFunction.$TFunctionBrand` symbol, and mock components cannot satisfy
// `React.ComponentType` under strict function types. `fromPartial` casts to the context type.

export const mockChatContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<ChatContextValue>({
    theme: 'messaging light',
    ...overrides,
  });

export const mockTranslationContextValue = (overrides: Record<string, unknown> = {}) =>
  fromPartial<TranslationContextValue>({
    t: mockT as TranslationContextValue['t'],
    tDateTimeParser: ((input) => ({
      calendar: () => String(input),
      format: () => String(input),
      fromNow: () => String(input),
      isSame: () => false,
    })) as TDateTimeParser,
    userLanguage: 'en',
    ...overrides,
  });

export const mockComponentContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<ComponentContextValue>(overrides);

export const mockMessageContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<MessageContextValue>(overrides);

export const mockMessageListContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<MessageListContextValue>(overrides);

export const mockChannelListContext = (overrides: Record<string, unknown> = {}) =>
  fromPartial<ChannelListContextValue>(overrides);
