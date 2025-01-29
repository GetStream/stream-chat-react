import { renderHook } from '@testing-library/react';
import { usePrependedMessagesCount } from '../VirtualizedMessageList';
import { generateMessage } from '../../../../mock-builders';

const defaultMsgStatus = 'received';
const getMessages = (length, statuses = []) =>
  Array.from({ length }, (_, i) =>
    generateMessage({
      status: statuses?.length ? statuses[i] || defaultMsgStatus : defaultMsgStatus,
    }),
  );

const messagesWithDateSeparator = ({ length, messages } = {}) => [
  generateMessage({ customType: 'message.date' }),
  ...(messages || getMessages(length)),
];

const hasDateSeparator = true;
const page1 = getMessages(5);
const page2 = getMessages(10);
const page1WithDateSeparator = messagesWithDateSeparator({ messages: page1 });
const page2WithDateSeparator = messagesWithDateSeparator({ messages: page2 });

const render = ({ hasDateSeparator, messages } = {}) =>
  renderHook(
    (props) => usePrependedMessagesCount(props.messages, props.hasDateSeparator),
    {
      initialProps: { hasDateSeparator, messages },
    },
  );
describe('usePrependMessagesCount', function () {
  it('is 0 when not messages are available', () => {
    const { result: resultMessagesUndefined } = render();
    const { result: resultMessagesUndefinedHasDateSeparator } = render({
      hasDateSeparator: true,
    });
    const { result: resultMessagesEmpty } = render({ messages: [] });
    const { result: resultMessagesEmptyHasDateSeparator } = render({
      hasDateSeparator: true,
      messages: [],
    });
    expect(resultMessagesUndefinedHasDateSeparator.current).toBe(0);
    expect(resultMessagesUndefined.current).toBe(0);
    expect(resultMessagesEmpty.current).toBe(0);
    expect(resultMessagesEmptyHasDateSeparator.current).toBe(0);
  });

  it('is 0 on first loaded page and date separator disabled', () => {
    const { result } = render({ messages: page1 });
    expect(result.current).toBe(0);
  });

  it('is 1 on first loaded page and date separator enabled', () => {
    const { result } = render({
      hasDateSeparator,
      messages: page1,
    });
    expect(result.current).toBe(0);
  });

  it('is 0 when re-rendered with no new messages and date separator disabled', () => {
    const props = {
      messages: page1,
    };
    const { rerender, result } = render(props);
    rerender(props);
    expect(result.current).toBe(0);
  });

  it('is 1 when re-rendered with no new messages and date separator enabled', () => {
    const props = {
      hasDateSeparator,
      messages: page1,
    };
    const { rerender, result } = render(props);
    rerender(props);
    expect(result.current).toBe(0);
  });

  it('is 0 when re-rendered with no new but swapped messages and date separator disabled', () => {
    const messages = getMessages(2, ['sending', 'sending']);
    const { rerender, result } = render({
      messages,
    });

    rerender({ messages: [messages[1], { ...messages[0], status: 'received' }] });
    expect(result.current).toBe(0);
  });

  it('is 0 when re-rendered with no new but swapped messages and date separator enabled', () => {
    const messages = getMessages(2, ['sending', 'sending']);
    const messages1 = messagesWithDateSeparator({
      messages,
    });
    const messages2 = messagesWithDateSeparator({
      messages: [
        messages[1],
        ...getMessages(1, ['sending']),
        { ...messages[0], status: 'received' },
      ],
    });
    const { rerender, result } = render({
      hasDateSeparator,
      messages: messages1,
    });
    rerender({
      hasDateSeparator,
      messages: messages2,
    });

    expect(result.current).toBe(0);
  });

  it('is equal to newly loaded page size when date separator disabled', () => {
    const { rerender, result } = render({
      messages: page1,
    });
    rerender({ messages: [...page2, ...page1] });
    expect(result.current).toBe(page2.length);
  });

  it('is equal to newly loaded page size + 1 when date separator enabled', () => {
    const { rerender, result } = render({
      hasDateSeparator,
      messages: page1WithDateSeparator,
    });
    rerender({
      hasDateSeparator,
      messages: messagesWithDateSeparator({ messages: [...page2, ...page1] }),
    });
    expect(result.current).toBe(page2.length);
  });

  it('is 0 when jumped to a message and date separator disabled', () => {
    const { rerender, result } = render({
      messages: page1,
    });
    rerender({ messages: page2 });
    expect(result.current).toBe(0);
  });

  it('is 0 when jumped to a message and date separator enabled', () => {
    const { rerender, result } = render({
      hasDateSeparator,
      messages: page1WithDateSeparator,
    });
    rerender({ hasDateSeparator, messages: page2WithDateSeparator });
    expect(result.current).toBe(0);
  });
});
