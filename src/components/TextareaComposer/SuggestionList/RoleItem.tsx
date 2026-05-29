import type { ComponentProps } from 'react';
import React from 'react';
import type { RoleMentionSuggestion } from 'stream-chat';
import { IconShield } from '../../Icons';
import { SuggestionItemWithAvatar } from './SuggestionItemWithAvatar';
import { TokenizedSuggestionParts } from './TokenizedSuggestionParts';

export type RoleItemProps = {
  entity: RoleMentionSuggestion;
  focused?: boolean;
} & ComponentProps<'button'>;

export const RoleItem = ({ entity, focused, ...buttonProps }: RoleItemProps) => {
  void focused;
  const title = entity.name || entity.id;

  return (
    <SuggestionItemWithAvatar
      {...buttonProps}
      avatarFallbackIcon={IconShield}
      title={title}
    >
      <TokenizedSuggestionParts tokenizedDisplayName={entity.tokenizedDisplayName} />
    </SuggestionItemWithAvatar>
  );
};
