import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import React from 'react';
import type { CommandResponse } from 'stream-chat';
import { useTranslationContext } from '../../../context';

export type CommandItemProps = {
  entity: CommandResponse;
};

export const CommandItem = (props: PropsWithChildren<CommandItemProps>) => {
  const { t } = useTranslationContext();
  const { entity } = props;
  const knownArgsTranslations = useMemo<Record<string, string>>(
    () => ({
      ban: t('ban-command-args'),
      giphy: t('giphy-command-args'),
      mute: t('mute-command-args'),
      unban: t('unban-command-args'),
      unmute: t('unmute-command-args'),
    }),
    [t],
  );

  const knownDescriptionTranslations = useMemo<Record<string, string>>(
    () => ({
      ban: t('ban-command-description'),
      giphy: t('giphy-command-description'),
      mute: t('mute-command-description'),
      unban: t('unban-command-description'),
      unmute: t('unmute-command-description'),
    }),
    [t],
  );

  return (
    <div className='str-chat__slash-command'>
      <span className='str-chat__slash-command-header'>
        <strong>{entity.name}</strong>{' '}
        {entity.args && (knownArgsTranslations[entity.name ?? ''] ?? t(entity.args))}
      </span>
      <br />
      <span className='str-chat__slash-command-description'>
        {entity.description &&
          (knownDescriptionTranslations[entity.name ?? ''] ?? t(entity.description))}
      </span>
    </div>
  );
};
