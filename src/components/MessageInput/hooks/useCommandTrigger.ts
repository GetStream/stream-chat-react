import { CommandItem } from '../../CommandItem/CommandItem';

import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useTranslationContext } from '../../../context';

import type { CommandResponse } from 'stream-chat';

type ValidCommand = Required<Pick<CommandResponse, 'name'>> &
  Omit<CommandResponse, 'name'>;

export const useCommandTrigger = () => {
  const { channelConfig } = useChannelStateContext('useCommandTrigger');
  const { t } = useTranslationContext('useCommandTrigger');

  const commands = channelConfig?.commands;

  return {
    component: CommandItem,
    // @ts-expect-error tmp
    dataProvider: (query, text, onReady) => {
      if (text.indexOf('/') !== 0 || !commands) {
        return [];
      }
      const selectedCommands = commands.filter(
        (command) => command.name?.indexOf(query) !== -1,
      );

      // sort alphabetically unless you're matching the first char
      selectedCommands.sort((a, b) => {
        let nameA = a.name?.toLowerCase();
        let nameB = b.name?.toLowerCase();
        if (nameA?.indexOf(query) === 0) {
          nameA = `0${nameA}`;
        }
        if (nameB?.indexOf(query) === 0) {
          nameB = `0${nameB}`;
        }
        // Should confirm possible null / undefined when TS is fully implemented
        if (nameA != null && nameB != null) {
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
        }

        return 0;
      });

      const result = selectedCommands.slice(0, 5);
      if (onReady)
        onReady(
          result
            .filter(
              (result): result is CommandResponse & { name: string } =>
                result.name !== undefined,
            )
            .map((commandData) => {
              const translatedCommandData: ValidCommand = {
                name: commandData.name,
              };

              if (commandData.args)
                translatedCommandData.args = t(`${commandData.name}-command-args`, {
                  defaultValue: commandData.args,
                });
              if (commandData.description)
                translatedCommandData.description = t(
                  `${commandData.name}-command-description`,
                  {
                    defaultValue: commandData.description,
                  },
                );

              return translatedCommandData;
            }),
          query,
        );

      return result;
    },
    // @ts-expect-error tmp
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.name,
      text: `/${entity.name}`,
    }),
  };
};
