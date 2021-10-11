import { CommandItem } from '../../CommandItem/CommandItem';

import { useChannelStateContext } from '../../../context/ChannelStateContext';
import type { CommandResponse } from 'stream-chat';

import type { CommandTriggerSetting } from '../DefaultTriggerProvider';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useCommandTrigger = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(): CommandTriggerSetting<Co> => {
  const { channelConfig } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>('useCommandTrigger');

  const commands = channelConfig?.commands;

  return {
    component: CommandItem,
    dataProvider: (query, text, onReady) => {
      if (text.indexOf('/') !== 0 || !commands) {
        return [];
      }
      const selectedCommands = commands.filter((command) => command.name?.indexOf(query) !== -1);

      // sort alphabetically unless the you're matching the first char
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

      const result = selectedCommands.slice(0, 10);
      if (onReady)
        onReady(
          result.filter(
            (result): result is CommandResponse<Co> & { name: string } => result.name !== undefined,
          ),
          query,
        );

      return result;
    },
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.name,
      text: `/${entity.name}`,
    }),
  };
};
