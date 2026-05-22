import React, { type ComponentProps, type ComponentType, useMemo } from 'react';
import type { CommandResponse } from 'stream-chat';
import { useMessageComposerContext, useTranslationContext } from '../../../context';
import { useMessageComposerCommands, useMessageComposerController } from '../hooks';
import {
  ContextMenuBackButton,
  ContextMenuButton,
  ContextMenuHeader,
  useContextMenuContext,
} from '../../Dialog';
import {
  IconAudio,
  IconChevronLeft,
  IconFlag,
  IconGiphy,
  IconMute,
  IconUserAdd,
  IconUserRemove,
} from '../../Icons';
import clsx from 'clsx';

const icons: Record<string, ComponentType> = {
  ban: IconUserRemove,
  flag: IconFlag,
  giphy: IconGiphy,
  mute: IconMute,
  unban: IconUserAdd,
  unmute: IconAudio,
};

export const CommandsMenuClassName = 'str-chat__context-menu--commands';

export const CommandsSubmenuHeader = () => {
  const { t } = useTranslationContext();
  const { returnToParentMenu } = useContextMenuContext();
  return (
    <ContextMenuHeader className='str-chat__context-menu__header--commands str-chat__context-menu__header--submenu-commands'>
      <ContextMenuBackButton onClick={returnToParentMenu}>
        <IconChevronLeft />
        <span>{t('Instant commands')}</span>
      </ContextMenuBackButton>
    </ContextMenuHeader>
  );
};

export const CommandsMenuHeader = () => {
  const { t } = useTranslationContext();
  return (
    <ContextMenuHeader className='str-chat__context-menu__header--commands'>
      <span>{t('Instant commands')}</span>
    </ContextMenuHeader>
  );
};

export const CommandsMenu = () => {
  const { closeMenu } = useContextMenuContext();
  const messageComposer = useMessageComposerController();
  const { textareaRef } = useMessageComposerContext();
  const commands = useMessageComposerCommands();
  const sortedCommands = useMemo(
    () =>
      [...commands].sort((a, b) =>
        (a.command.name ?? '').localeCompare(b.command.name ?? ''),
      ),
    [commands],
  );

  return (
    <>
      {sortedCommands.map(({ command, enabled }) => (
        <CommandContextMenuItem
          command={command}
          enabled={enabled}
          key={command.name}
          onClick={() => {
            if (!command.name || !enabled) return;
            messageComposer.textComposer.setCommand(command);
            closeMenu();
            // Defer the focus to the next frame so it wins over FocusScope's restore-to-attachment-selector-button behavior.
            requestAnimationFrame(() => textareaRef.current?.focus());
          }}
        />
      ))}
    </>
  );
};

export const useCommandTranslation = (command: CommandResponse) => {
  const { t } = useTranslationContext();

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

  const args =
    command.args && (knownArgsTranslations[command.name ?? ''] ?? t(command.args));
  const description =
    command.description &&
    (knownDescriptionTranslations[command.name ?? ''] ?? t(command.description));

  return { args, description };
};

export const CommandContextMenuItem = ({
  className,
  command,
  enabled = true,
  ...props
}: ComponentProps<'button'> & {
  command: CommandResponse & { name: string };
  enabled?: boolean;
}) => {
  const { args, description } = useCommandTranslation(command);

  // todo: retrieve the command trigger char from textComposer - needed adjustment in LLC
  const details = useMemo(
    () => (args ? `/${command.name} ${args}` : `/${command.name}`),
    [args, command.name],
  );
  const ariaLabel = useMemo(
    () => (description ? `${description}, ${details}` : details),
    [description, details],
  );

  return (
    <ContextMenuButton
      aria-label={ariaLabel}
      {...props}
      className={clsx('str-chat__context-menu__button--command', className)}
      details={details}
      disabled={!enabled}
      Icon={icons[command.name]}
      key={command.name}
      label={command.name}
    />
  );
};
