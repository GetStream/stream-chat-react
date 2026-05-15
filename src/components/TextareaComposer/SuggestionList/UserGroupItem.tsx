import type { ComponentProps } from 'react';
import React from 'react';
import type { UserGroupMentionSuggestion } from 'stream-chat';
import { IconUsers } from '../../Icons';
import { useTranslationContext } from '../../../context';
import { TokenizedSuggestionParts } from './TokenizedSuggestionParts';
import { SuggestionItemWithAvatar } from './SuggestionItemWithAvatar';

export type UserGroupItemProps = {
  entity: UserGroupMentionSuggestion;
  focused?: boolean;
} & ComponentProps<'button'>;

const memberCountLabelKey = '{{ memberCount }} members';

export const UserGroupItem = ({
  entity,
  focused,
  ...buttonProps
}: UserGroupItemProps) => {
  void focused;
  const { t } = useTranslationContext();
  const title = entity.name || entity.id;
  const memberCountLabel =
    typeof entity.memberCount === 'number'
      ? t(memberCountLabelKey, { memberCount: entity.memberCount }) ===
        memberCountLabelKey
        ? `${entity.memberCount} members`
        : t(memberCountLabelKey, { memberCount: entity.memberCount })
      : undefined;

  return (
    <SuggestionItemWithAvatar
      {...buttonProps}
      avatarFallbackIcon={IconUsers}
      details={memberCountLabel}
      title={`@${title}`}
    >
      <span>@</span>
      <TokenizedSuggestionParts tokenizedDisplayName={entity.tokenizedDisplayName} />
    </SuggestionItemWithAvatar>
  );
};
