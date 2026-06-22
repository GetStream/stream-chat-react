import type { MentionItemComponentProps } from './types';

type MinimalMentionEntity = {
  id: string;
  mentionType: string;
  name?: string;
};

export type SpecialMentionItemProps = MentionItemComponentProps<MinimalMentionEntity>;

export const SpecialMentionItem = () => null;
