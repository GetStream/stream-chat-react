import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import {
  AIStateIndicator,
  Button,
  Channel,
  LoadingIndicator,
  MessageComposer,
  MessageList,
  useChatContext,
  useComponentContextIcons,
} from 'stream-chat-react';
import './AssistantWidget.css';

/**
 * Watches the user's channel with the assistant the first time the window opens, and keeps it
 * afterwards, until `channelId` names another channel. A user who never opens the window costs no
 * request.
 */
const useAssistantChannel = (channelId: string, isOpen: boolean) => {
  const { client } = useChatContext();
  const [channel, setChannel] = useState<StreamChannel>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isOpen || channel?.id === channelId) return;
    let cancelled = false;
    setFailed(false);
    client
      .channel('messaging', channelId)
      .watch()
      .then((watched) => !cancelled && setChannel(watched))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [channel, channelId, client, isOpen]);

  return { channel, failed };
};

/**
 * A menu, picker or suggestion list inside the window is open, so Escape closes that first. Their
 * toggles carry `aria-expanded="true"`, and the composer's textarea carries `aria-controls` while
 * its suggestions show.
 */
const hasOpenPopup = (container: HTMLElement | null) =>
  !!container?.querySelector('[aria-expanded="true"], textarea[aria-controls]');

/**
 * The Escape was pressed in the window or on the launcher, and nothing inside the window used it,
 * as the composer does to leave a command. A modal opened from the window renders in a portal, but
 * React still bubbles its keydown here, and that Escape closes only the modal.
 */
const isEscapeForWindow = (
  event: KeyboardEvent,
  container: HTMLElement | null,
  launcher: HTMLElement | null,
) => {
  const target = event.target as Node;
  return (
    (!!container?.contains(target) || !!launcher?.contains(target)) &&
    !event.defaultPrevented &&
    !hasOpenPopup(container)
  );
};

type AssistantWidgetProps = {
  /** The id of the user's `messaging` channel with the assistant. */
  channelId: string;
  /** The window's heading, which also names it for assistive technology. */
  title?: string;
};

/**
 * A launcher button at the bottom right of the page that opens a small, non-modal chat window with
 * the assistant. Escape or the close button closes it and gives focus back to the launcher.
 */
export const AssistantWidget = ({
  channelId,
  title = 'Assistant',
}: AssistantWidgetProps) => {
  const { IconMessageBubble, IconXmark } = useComponentContextIcons();
  const [isOpen, setIsOpen] = useState(false);
  const { channel, failed } = useAssistantChannel(channelId, isOpen);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const windowRef = useRef<HTMLElement>(null);
  const windowId = useId();
  const titleId = useId();

  const close = () => {
    setIsOpen(false);
    launcherRef.current?.focus();
  };

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !isOpen) return;
    // Escape inside the open widget is the widget's, so handlers on the page don't act on it too,
    // such as the channel list's search, which focuses its input on any Escape.
    event.stopPropagation();
    if (!isEscapeForWindow(event, windowRef.current, launcherRef.current)) return;
    event.preventDefault();
    close();
  };

  return (
    <div className='cookbook-assistant-widget' onKeyDown={closeOnEscape}>
      <Button
        appearance='solid'
        aria-controls={isOpen ? windowId : undefined}
        aria-expanded={isOpen}
        aria-label={`Chat with ${title}`}
        circular
        className='cookbook-assistant-launcher'
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        ref={launcherRef}
        size='lg'
        variant='primary'
      >
        {isOpen ? <IconXmark /> : <IconMessageBubble />}
      </Button>
      {isOpen && (
        <section
          aria-labelledby={titleId}
          className='cookbook-assistant-window'
          id={windowId}
          ref={windowRef}
          role='dialog'
        >
          <header className='cookbook-assistant-window__header'>
            <h2 className='cookbook-assistant-window__title' id={titleId}>
              {title}
            </h2>
            <Button
              appearance='ghost'
              aria-label={`Close ${title}`}
              circular
              onClick={close}
              size='md'
              variant='secondary'
            >
              <IconXmark />
            </Button>
          </header>
          <div className='cookbook-assistant-window__body'>
            {channel ? (
              <Channel channel={channel}>
                <MessageList />
                <AIStateIndicator />
                {/* Focus moves to the text input when the window opens. */}
                <MessageComposer focus />
              </Channel>
            ) : failed ? (
              <p className='cookbook-assistant-window__note' role='alert'>
                Couldn’t open the conversation. Close the window and try again.
              </p>
            ) : (
              <LoadingIndicator />
            )}
          </div>
        </section>
      )}
    </div>
  );
};
