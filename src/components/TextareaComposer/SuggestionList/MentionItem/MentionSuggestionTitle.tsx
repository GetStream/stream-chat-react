import type { ReactNode } from 'react';

export type MentionSuggestionTitleProps = {
  children: ReactNode;
};

export const MentionSuggestionTitle = ({ children }: MentionSuggestionTitleProps) => (
  <>@{children}</>
);
