import React from 'react';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useMessageListScrollManager } from '../useMessageListScrollManager';

import { ChatProvider } from '../../../../context/ChatContext';
import { generateUser, getTestClientWithUser } from '../../../../mock-builders';

const generateMessages = (length) =>
  Array.from({ length }, (_, index) => ({ id: index.toString(), userId: '0' }));

const defaultInputs = {
  messages: [],
  scrollContainerMeasures: () => ({
    offsetHeight: 200,
    scrollHeight: 2000,
  }),
  scrolledUpThreshold: 200,
  scrollToBottom: () => {},
  showNewMessages: () => {},
};

const alice = generateUser({ id: 'alice' });
let client;

describe('useMessageListScrollManager', () => {
  beforeEach(async () => {
    client = await getTestClientWithUser(alice);
  });
  afterEach(cleanup);

  it('emits scroll to bottom on mount', () => {
    const scrollToBottom = jest.fn();
    const Comp = () => {
      useMessageListScrollManager({
        ...defaultInputs,
        scrollToBottom,
      });

      return <div></div>;
    };

    const { rerender } = render(<Comp />);
    rerender(<Comp />);

    expect(scrollToBottom).toHaveBeenCalledTimes(1);
  });

  it('emits scrollTop delta when messages are prepended', () => {
    const onScrollBy = jest.fn();
    const Comp = (props) => {
      useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        onScrollBy,
        scrollContainerMeasures: () => ({
          scrollHeight: props.scrollHeight,
        }),
        scrollToBottom: () => {},
      });

      return <div></div>;
    };

    const messages = generateMessages(20);
    const { rerender } = render(<Comp messages={messages} scrollHeight={400} />);

    rerender(<Comp messages={generateMessages(10).concat(messages)} scrollHeight={600} />);

    expect(onScrollBy).toHaveBeenCalledWith(200);
  });

  it('emits scroll to bottom when new messages arrive', () => {
    const scrollToBottom = jest.fn();
    const Comp = (props) => {
      const updateScrollTop = useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        scrollContainerMeasures: () => ({
          offsetHeight: 100,
          scrollHeight: props.scrollHeight,
        }),
        scrollToBottom,
      });

      updateScrollTop(300);

      return <div></div>;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={{ client }}>
        <Comp messages={messages} scrollHeight={400} />
      </ChatProvider>,
    );

    rerender(<Comp messages={messages.concat(generateMessages(10))} scrollHeight={600} />);

    expect(scrollToBottom).toHaveBeenCalledTimes(2);
  });

  it('does not emit scroll to bottom when new messages arrive and user has scrolled up', () => {
    const showNewMessages = jest.fn();
    const Comp = (props) => {
      const updateScrollTop = useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        scrollContainerMeasures: () => ({
          scrollHeight: props.scrollHeight,
        }),
        showNewMessages,
      });

      updateScrollTop(props.scrollTop);

      return <div></div>;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={{ client }}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={300} />
      </ChatProvider>,
    );

    // simulate scrolled up
    rerender(
      <ChatProvider value={{ client }}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={200} />
      </ChatProvider>,
    );

    // add new messages
    rerender(
      <ChatProvider value={{ client }}>
        <Comp
          messages={messages.concat(generateMessages(10))}
          offsetHeight={100}
          scrollHeight={600}
          scrollTop={200}
        />
      </ChatProvider>,
    );

    expect(showNewMessages).toHaveBeenCalledTimes(1);
  });

  it('emits scroll to bottom when new own message is posted, regardless of scroll position', () => {
    const scrollToBottom = jest.fn();
    const Comp = (props) => {
      const updateScrollTop = useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        scrollContainerMeasures: () => ({
          scrollHeight: props.scrollHeight,
        }),
        scrollToBottom,
      });

      updateScrollTop(props.scrollTop);

      return <div></div>;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={{ client }}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={300} />,
      </ChatProvider>,
    );

    // simulate scrolled up
    rerender(
      <ChatProvider value={{ client }}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={200} />
      </ChatProvider>,
    );

    // add new messages
    rerender(
      <ChatProvider value={{ client }}>
        <Comp
          messages={messages.concat([{ id: 100, userId: client.userID }])}
          offsetHeight={100}
          scrollHeight={600}
          scrollTop={200}
        />
      </ChatProvider>,
    );

    expect(scrollToBottom).toHaveBeenCalledTimes(1);
  });
});
