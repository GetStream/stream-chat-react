import type { ComponentProps } from 'react';

export type MentionItemComponentProps<TEntity> = {
  entity: TEntity;
  focused?: boolean;
} & ComponentProps<'button'>;
