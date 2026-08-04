import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';
import { MessageRepliesCountButton } from '../MessageRepliesCountButton';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { TranslationProvider } from '../../../context';
import type { TranslationContextValue } from '../../../context';
import {
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

  // MERGE-RECONCILE (test migration): the reply-count button no longer gates on the
  // 'send-reply' channel capability (permission gating was removed from this component in
  // the slot-layout refactor). The button now always renders enabled.
  it('should not be disabled regardless of channel capabilities', () => {
    const { getByText } = renderComponent({ reply_count: 1 });

    expect(getByText(defaultSingularText)).not.toBeDisabled();
  });
});
