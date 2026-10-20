import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';
import { MessageRepliesCountButton } from '../MessageRepliesCountButton';
import { Message } from '../Message';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import {
  defaultWorkspaceNavigation,
  TranslationProvider,
  WithComponents,
  WorkspaceNavigationProvider,
} from '../../../context';
import type { TranslationContextValue } from '../../../context';
import {
  generateMessage,
  initClientWithChannels,
  mockTranslationContextValue,
} from '../../../mock-builders';

const onClickMock = vi.fn();
const defaultSingularText = '1 reply';
const defaultPluralText = '2 replies';

const i18nMock = ((key: string, { count }: { count: number }) =>
  count > 1 ? defaultPluralText : defaultSingularText) as TranslationContextValue['t'];

let channel: ChannelType;
let client: StreamChat;

const renderComponent = (props: any) =>
  render(
    <Chat client={client}>
      <Channel channel={channel}>
        <TranslationProvider value={mockTranslationContextValue({ t: i18nMock })}>
          <MessageRepliesCountButton {...props} onClick={onClickMock} />
        </TranslationProvider>
      </Channel>
    </Chat>,
  );

describe('MessageRepliesCountButton', () => {
  beforeEach(async () => {
    ({
      channels: [channel],
      client,
    } = await initClientWithChannels());
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('should render the right text when there is one reply, and labelSingle is not defined', () => {
    const { getByText } = renderComponent({ reply_count: 1 });
    const button = getByText(defaultSingularText);
    expect(button).not.toBeDisabled();
  });

  it('should render the right text when there is one reply, and labelSingle is defined', () => {
    const customSingularLabel = 'text';
    const { getByText } = renderComponent({
      labelSingle: customSingularLabel,
      reply_count: 1,
    });

    expect(getByText(`1 ${customSingularLabel}`)).toBeInTheDocument();
  });

  it('should render the right text when there is more than one reply, and labelPlural is not defined', () => {
    const { getByText } = renderComponent({ reply_count: 2 });

    expect(getByText(defaultPluralText)).toBeInTheDocument();
  });

  it('should render the right text when there is more than one reply, and labelPlural is defined', () => {
    const customPluralLabel = 'text';
    const { getByText } = renderComponent({
      labelPlural: customPluralLabel,
      reply_count: 2,
    });

    expect(getByText(`2 ${customPluralLabel}`)).toBeInTheDocument();
  });

  it('should call the onClick prop if the button is clicked', () => {
    const { getByTestId } = renderComponent({
      reply_count: 1,
    });
    fireEvent.click(getByTestId('replies-count-button'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should not render anything if reply_count is 0 or undefined', () => {
    const { queryByTestId } = renderComponent({
      reply_count: 0,
    });

    expect(queryByTestId('replies-count-button')).not.toBeInTheDocument();
  });

  it('should not render ReplyIcon', () => {
    const { queryByTestId } = renderComponent({
      reply_count: 1,
    });
    expect(queryByTestId('reply-icon')).not.toBeInTheDocument();
  });

  describe('inside a Message, without an onClick prop', () => {
    // A MessageUI that renders the button the way the default one does: without `onClick`.
    const ReplyCountOnlyMessageUI = () => <MessageRepliesCountButton reply_count={2} />;

    const renderInMessage = ({
      openThread,
      workspaceOpenThread = vi.fn(),
    }: {
      openThread?: (...args: unknown[]) => void;
      workspaceOpenThread?: (...args: unknown[]) => void;
    }) => {
      const message = generateMessage({ reply_count: 2 });
      const result = render(
        <Chat client={client}>
          <Channel channel={channel}>
            <TranslationProvider value={mockTranslationContextValue({ t: i18nMock })}>
              <WorkspaceNavigationProvider
                value={{ ...defaultWorkspaceNavigation, openThread: workspaceOpenThread }}
              >
                <WithComponents overrides={{ MessageUI: ReplyCountOnlyMessageUI }}>
                  <Message message={message} openThread={openThread} />
                </WithComponents>
              </WorkspaceNavigationProvider>
            </TranslationProvider>
          </Channel>
        </Chat>,
      );
      return { message, ...result };
    };

    it("calls the Message's openThread override", () => {
      const openThread = vi.fn();
      const workspaceOpenThread = vi.fn();
      const { getByTestId, message } = renderInMessage({
        openThread,
        workspaceOpenThread,
      });

      fireEvent.click(getByTestId('replies-count-button'));

      expect(openThread).toHaveBeenCalledWith(
        expect.objectContaining({ id: message.id }),
        expect.anything(),
      );
      expect(workspaceOpenThread).not.toHaveBeenCalled();
    });

    it('opens the thread through workspace navigation without an override', () => {
      const workspaceOpenThread = vi.fn();
      const { getByTestId, message } = renderInMessage({ workspaceOpenThread });

      fireEvent.click(getByTestId('replies-count-button'));

      expect(workspaceOpenThread).toHaveBeenCalledWith({
        channel,
        message: expect.objectContaining({ id: message.id }),
      });
    });
  });

  it('should not be disabled regardless of channel capabilities', () => {
    const { getByText } = renderComponent({ reply_count: 1 });

    expect(getByText(defaultSingularText)).not.toBeDisabled();
  });
});
