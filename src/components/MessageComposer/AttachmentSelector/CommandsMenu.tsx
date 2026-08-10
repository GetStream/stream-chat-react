import React, { type ComponentProps, type ComponentType, useMemo } from 'react';
import type { Command } from 'stream-chat';
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
import { useInteractionAnnouncements } from '../../Accessibility';
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
      <ContextMenuBackButton
        aria-label={t(
          'messageComposer.commandsMenu.backAttachments.ariaLabel',
          'Back to attachments',
        )}
        onClick={returnToParentMenu}
      >
        <IconChevronLeft />
        <span>
          {t('messageComposer.commandsMenu.instantCommands.text', 'Instant commands')}
        </span>
      </ContextMenuBackButton>
    </ContextMenuHeader>
  );
};

export const CommandsMenuHeader = () => {
  const { t } = useTranslationContext();
  return (
    <ContextMenuHeader className='str-chat__context-menu__header--commands'>
      <span>
        {t('messageComposer.commandsMenu.instantCommands.text', 'Instant commands')}
      </span>
    </ContextMenuHeader>
  );
};

export const CommandsMenu = () => {
  const { closeMenu } = useContextMenuContext();
  const { announceInteraction } = useInteractionAnnouncements();
  const messageComposer = useMessageComposerController();
  const { textareaRef } = useMessageComposerContext();
  // Render commands in the channel config's own order (no client re-sort) — matches the composer's
  // suggestion list, which likewise trusts the SDK's ordering.
  const commands = useMessageComposerCommands();

  return (
    <>
      {commands.map(({ command, enabled }) => (
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
            announceInteraction('command.selected', { command: command.name });
          }}
        />
      ))}
    </>
  );
};

export const useCommandTranslation = (command: Command) => {
  const { t } = useTranslationContext();

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
  const knownDescriptionTranslations = useMemo<Record<string, string>>(
    () => ({
      ban: t('command.ban.description', 'Ban a user'),
      giphy: t('command.giphy.description', 'Post a random gif to the channel'),
      mute: t('command.mute.description', 'Mute a user'),
      unban: t('command.unban.description', 'Unban a user'),
      unmute: t('command.unmute.description', 'Unmute a user'),
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
  command: Command & { name: string };
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
