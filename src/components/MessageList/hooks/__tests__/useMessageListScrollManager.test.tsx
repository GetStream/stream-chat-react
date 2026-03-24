import React from 'react';
import { cleanup, render } from '@testing-library/react';

import { useMessageListScrollManager } from '../';

import { ChatProvider } from '../../../../context/ChatContext';
import { generateUser, getTestClientWithUser } from '../../../../mock-builders';

const myUserId = 'alice';

const generateMessages = (length, userId = myUserId) =>
  Array.from({ length }, (_, index) => ({ id: index.toString(), userId }));

const defaultInputs: any = {
  loadMoreScrollThreshold: 100,
  messages: [],
  scrollContainerMeasures: () => ({
    offsetHeight: 200,
    scrollHeight: 2000,
  }),
  scrolledUpThreshold: 200,
  scrollToBottom: () => {},
  showNewMessages: () => {},
};

const alice = generateUser({ id: myUserId });
let client;

describe('useMessageListScrollManager', () => {
  beforeEach(async () => {
    client = await getTestClientWithUser(alice);
  });
  afterEach(cleanup);

  it('does not emit scroll to bottom on mount', () => {
    const scrollToBottom = vi.fn();
    const Comp = () => {
      useMessageListScrollManager({
        ...defaultInputs,
        scrollToBottom,
      });

      return <div />;
    };

    const { rerender } = render(
      <ChatProvider value={{ client } as any}>
        <Comp />
      </ChatProvider>,
    );
    rerender(
      <ChatProvider value={{ client } as any}>
        <Comp />
      </ChatProvider>,
    );

    expect(scrollToBottom).not.toHaveBeenCalled();
  });

  it('emits scrollTop delta when messages are prepended', () => {
    const onScrollBy = vi.fn();
    const Comp = (props: any) => {
      useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        onScrollBy,
        scrollContainerMeasures: () => ({
          scrollHeight: props.scrollHeight,
        }),
        scrollToBottom: () => {},
      } as any);

      return <div />;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={{ client } as any}>
        <Comp messages={messages} scrollHeight={400} />
      </ChatProvider>,
    );

    rerender(
      <ChatProvider value={{ client } as any}>
        <Comp messages={generateMessages(10).concat(messages)} scrollHeight={600} />
      </ChatProvider>,
    );

    expect(onScrollBy).toHaveBeenCalledWith(200);
  });

  it('emits scroll to bottom when new messages arrive', () => {
    const scrollToBottom = vi.fn();
    const Comp = (props: any) => {
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

      return <div />;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={{ client } as any}>
        <Comp messages={messages} scrollHeight={400} />
      </ChatProvider>,
    );

    rerender(
      <ChatProvider value={{ client } as any}>
        <Comp messages={messages.concat(generateMessages(10))} scrollHeight={600} />
      </ChatProvider>,
    );

    expect(scrollToBottom).toHaveBeenCalledTimes(1);
  });

  it('does not emit scroll to bottom when new messages arrive and user has scrolled up', () => {
    const showNewMessages = vi.fn();
    const Comp = (props: any) => {
      const updateScrollTop = useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        scrollContainerMeasures: () => ({
          scrollHeight: props.scrollHeight,
        }),
        showNewMessages,
      } as any);

      updateScrollTop(props.scrollTop);

      return <div />;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={{ client } as any}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={300} />
      </ChatProvider>,
    );

    // simulate scrolled up
    rerender(
      <ChatProvider value={{ client } as any}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={200} />
      </ChatProvider>,
    );

    // add new messages
    rerender(
      <ChatProvider value={{ client } as any}>
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
    const scrollToBottom = vi.fn();
    const Comp = (props: any) => {
      const updateScrollTop = useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        scrollContainerMeasures: () => ({
          scrollHeight: props.scrollHeight,
        }),
        scrollToBottom,
      } as any);

      updateScrollTop(props.scrollTop);

      return <div />;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={{ client } as any}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={300} />
        ,
      </ChatProvider>,
    );

    // simulate scrolled up
    rerender(
      <ChatProvider value={{ client } as any}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={200} />
      </ChatProvider>,
    );

    // add new messages
    rerender(
      <ChatProvider value={{ client } as any}>
        <Comp
          messages={messages.concat([{ id: 100, user: { id: client.userID } }] as any)}
          offsetHeight={100}
          scrollHeight={600}
          scrollTop={200}
        />
      </ChatProvider>,
    );

    expect(scrollToBottom).toHaveBeenCalledTimes(1);
  });
});
