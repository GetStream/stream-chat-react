import { useMemo } from 'react';
import type { TextComposerState } from 'stream-chat';
import { useMessageInputContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useCooldownRemaining, useMessageComposer } from '../../MessageInput';

type UseTextareaPlaceholderProps = {
  placeholder?: string;
};

const textComposerStateSelector = ({ command }: TextComposerState) => ({ command });

export const useTextareaPlaceholder = ({
  placeholder,
}: UseTextareaPlaceholderProps = {}) => {
  const { t } = useTranslationContext();
  const { additionalTextareaProps } = useMessageInputContext();
  const cooldownRemaining = useCooldownRemaining();
  const messageComposer = useMessageComposer();
  const { command } = useStateStore(
    messageComposer.textComposer.state,
    textComposerStateSelector,
  );

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

  const commandArgs =
    command?.args && (knownArgsTranslations[command.name ?? ''] ?? t(command.args));
  const commandPlaceholder =
    command?.name === 'giphy' ? t('Search GIFs') : (commandArgs ?? undefined);

  const defaultPlaceholder =
    placeholder ?? additionalTextareaProps?.placeholder ?? t('Type your message');

  if (cooldownRemaining) {
    return t('Slow mode, wait {{ seconds }}s...', { seconds: cooldownRemaining });
  }

  return commandPlaceholder ?? defaultPlaceholder;
};
