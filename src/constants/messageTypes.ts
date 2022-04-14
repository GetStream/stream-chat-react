import type { CustomMessageType } from '../types/types';

export const CUSTOM_MESSAGE_TYPE: Record<'date' | 'intro', CustomMessageType> = {
  date: 'message.date',
  intro: 'channel.intro',
};
