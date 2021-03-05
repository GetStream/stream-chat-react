import React from 'react';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useMessageListScrollManager } from '../useMessageListScrollManager';

const generateMessages = (length) =>
  Array.from({ length }, (_, index) => ({ id: index.toString(), userId: '0' }));

const defaultInputs = {
  currentUserId: () => '2',
  messageId: (message) => message.id,
  messages: [],
  messageUserId: (message) => message.userId,
  onNewMessages: () => {},
  onScrollToBottom: () => {},
  scrollContainerMeasures: () => ({
    offsetHeight: 200,
    scrollHeight: 2000,
  }),
  toleranceThreshold: 200,
};

describe('useMessageListScrollManager', () => {
  afterEach(cleanup);
  it('emits scroll to bottom on mount', () => {
    const onScrollToBottom = jest.fn();
    const Comp = () => {
      useMessageListScrollManager({
        ...defaultInputs,
        onScrollToBottom,
      });

      return <div></div>;
    };

    const { rerender } = render(<Comp />);
    rerender(<Comp />);

    expect(onScrollToBottom).toHaveBeenCalledTimes(1);
  });

  it('emits scrollTop delta when messages are prepended', () => {
    const onScrollBy = jest.fn();
    const Comp = (props) => {
      useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        onScrollBy,
        onScrollToBottom: () => {},
        scrollContainerMeasures: () => ({
          scrollHeight: props.scrollHeight,
        }),
      });

      return <div></div>;
    };

    const messages = generateMessages(20);
    const { rerender } = render(<Comp messages={messages} scrollHeight={400} />);

    rerender(<Comp messages={generateMessages(10).concat(messages)} scrollHeight={600} />);

    expect(onScrollBy).toHaveBeenCalledWith(200);
  });

  it('emits scroll to bottom when new messages arrive', () => {
    const onScrollToBottom = jest.fn();
    const Comp = (props) => {
      const updateScrollTop = useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        onScrollToBottom,
        scrollContainerMeasures: () => ({
          offsetHeight: 100,
          scrollHeight: props.scrollHeight,
        }),
      });

      updateScrollTop(300);

      return <div></div>;
    };

    const messages = generateMessages(20);
    const { rerender } = render(<Comp messages={messages} scrollHeight={400} />);

    rerender(<Comp messages={messages.concat(generateMessages(10))} scrollHeight={600} />);

    expect(onScrollToBottom).toHaveBeenCalledTimes(2);
  });

  it('does not emit scroll to bottom when new messages arrive and user has scrolled up', () => {
    const onNewMessages = jest.fn();
    const Comp = (props) => {
      const updateScrollTop = useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        onNewMessages,
        scrollContainerMeasures: () => ({
          scrollHeight: props.scrollHeight,
        }),
      });

      updateScrollTop(props.scrollTop);

      return <div></div>;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={300} />,
    );

    // simulate scrolled up
    rerender(<Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={200} />);

    // add new messages
    rerender(
      <Comp
        messages={messages.concat(generateMessages(10))}
        offsetHeight={100}
        scrollHeight={600}
        scrollTop={200}
      />,
    );

    expect(onNewMessages).toHaveBeenCalledTimes(1);
  });

  it('emits scroll to bottom when new own message is posted, regardless of scroll position', () => {
    const onScrollToBottom = jest.fn();
    const MY_ID = '2';
    const Comp = (props) => {
      const updateScrollTop = useMessageListScrollManager({
        ...defaultInputs,
        currentUserId: () => MY_ID,
        messages: props.messages,
        onScrollToBottom,
        scrollContainerMeasures: () => ({
          scrollHeight: props.scrollHeight,
        }),
      });

      updateScrollTop(props.scrollTop);

      return <div></div>;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={300} />,
    );

    // simulate scrolled up
    rerender(<Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={200} />);

    // add new messages
    rerender(
      <Comp
        messages={messages.concat([{ id: 100, userId: MY_ID }])}
        offsetHeight={100}
        scrollHeight={600}
        scrollTop={200}
      />,
    );

    expect(onScrollToBottom).toHaveBeenCalledTimes(2);
  });
});
