import type { DefaultMessageBubbleContentType } from 'stream-chat-react';

import {
  BUBBLE_CONTENT_LABELS,
  resolveBubbleContentOrder,
} from '../../../MessageBubble/bubbleContent';
import { appSettingsStore, useAppSettingsState } from '../../state';
import {
  SettingsTabBody,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';
import { SortableSectionList } from '../SortableSectionList';

type MessageTabProps = {
  close: () => void;
};

export const MessageTab = ({ close }: MessageTabProps) => {
  const { messageBubble } = useAppSettingsState();

  return (
    <div className='app__settings-modal__content-stack'>
      <SettingsTabLayoutHeader
        close={close}
        description='Configure how a message renders.'
        title='Message'
      />

      <SettingsTabBody>
        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Bubble content order</div>
          <div className='app__settings-modal__field-comment'>
            The order of what a message bubble holds, rendered through{' '}
            <code>MessageBubbleContent</code> with a <code>messageBubbleContentSet</code>{' '}
            built from <code>defaultMessageBubbleContentSet</code>. A message shows only
            the parts it has. Drag a part, or use its arrows, to reorder it.
          </div>
          <SortableSectionList
            ariaLabel='Message bubble content'
            idPrefix='message-bubble-content'
            onOrderChange={(contentOrder) =>
              appSettingsStore.partialNext({
                messageBubble: { ...messageBubble, contentOrder },
              })
            }
            sections={resolveBubbleContentOrder(messageBubble.contentOrder).map(
              (type) => ({
                description: <code>{type}</code>,
                label:
                  BUBBLE_CONTENT_LABELS[type as DefaultMessageBubbleContentType] ?? type,
                type,
              }),
            )}
          />
        </div>
      </SettingsTabBody>
    </div>
  );
};
