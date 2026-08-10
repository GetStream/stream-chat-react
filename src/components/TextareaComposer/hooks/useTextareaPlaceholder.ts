import { useMemo } from 'react';
import type { TextComposerState } from 'stream-chat';
import { useMessageComposerContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useCooldownRemaining } from '../../MessageComposer/hooks/useCooldownRemaining';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';

type UseTextareaPlaceholderProps = {
  placeholder?: string;
};

const textComposerStateSelector = ({ command }: TextComposerState) => ({ command });

export const useTextareaPlaceholder = ({
  placeholder,
}: UseTextareaPlaceholderProps = {}) => {
  const { t } = useTranslationContext();
  const { additionalTextareaProps } = useMessageComposerContext();
  const cooldownRemaining = useCooldownRemaining();
  const messageComposer = useMessageComposerController();
  const { command } = useStateStore(
    messageComposer.textComposer.state,
    textComposerStateSelector,
  );

  const knownArgsTranslations = useMemo<Record<string, string>>(
    () => ({
      ban: t('command.ban.args', '[@username] [text]'),
      giphy: t('command.giphy.args', '[text]'),
      mute: t('command.mute.args', '[@username]'),
      unban: t('command.unban.args', '[@username]'),
      unmute: t('command.unmute.args', '[@username]'),
    }),
    [t],
  );

  const commandArgs =
    command?.args && (knownArgsTranslations[command.name ?? ''] ?? t(command.args));
  const commandPlaceholder =
    command?.name === 'giphy'
      ? t('textareaComposer.textareaPlaceholder.searchGiFs.label', 'Search GIFs')
      : (commandArgs ?? undefined);

  const defaultPlaceholder =
    placeholder ??
    additionalTextareaProps?.placeholder ??
    t('textareaComposer.textareaPlaceholder.sendMessage.label', 'Send a message');

  if (cooldownRemaining) {
    return t(
      'textareaComposer.textareaPlaceholder.slowModeWaitS.label',
      'Slow mode, wait {{ seconds }}s...',
      { seconds: cooldownRemaining },
    );
  }

  return commandPlaceholder ?? defaultPlaceholder;
};
