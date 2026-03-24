import React from 'react';

import { act, cleanup, render, screen } from '@testing-library/react';

import { EventComponent } from '../EventComponent';
import { Chat } from '../../Chat';
import { getTestClient } from '../../../mock-builders';

const SYSTEM_MSG_TEST_ID = 'message-system';

describe('EventComponent', () => {
  afterEach(cleanup);

  const message = {
    created_at: new Date('2020-03-13T10:18:38.148025Z'),
    type: 'system',
  };

  const renderComponent = async ({ chatProps, props } = {}) => {
    let result;
    await act(() => {
      result = render(
        <Chat client={getTestClient()} {...chatProps}>
          <EventComponent message={message} {...props} />
        </Chat>,
      );
    });
    return result;
  };

  it('should render null for empty message', () => {
    const { container } = render(<EventComponent message={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render null for non-system message types', () => {
    const { container } = render(<EventComponent message={{ type: 'channel.event' }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render system events', async () => {
    await renderComponent({
      props: { message: { ...message, text: 'system event' } },
    });
    const systemMsg = screen.getByTestId(SYSTEM_MSG_TEST_ID);
    expect(systemMsg).toBeInTheDocument();
    expect(systemMsg).toHaveClass('str-chat__message--system');

    const textDiv = systemMsg.querySelector('.str-chat__message--system__text');
    expect(textDiv).toBeInTheDocument();

    const span = textDiv.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('system event');

    // No line dividers or date section in the new structure
    expect(
      systemMsg.querySelector('.str-chat__message--system__line'),
    ).not.toBeInTheDocument();
    expect(
      systemMsg.querySelector('.str-chat__message--system__date'),
    ).not.toBeInTheDocument();
  });

  it('should render system event with unsafe HTML when unsafeHTML is true', async () => {
    await renderComponent({
      props: {
        message: {
          ...message,
          html: '<strong>html event</strong>',
          text: 'system event',
        },
        unsafeHTML: true,
      },
    });
    const systemMsg = screen.getByTestId(SYSTEM_MSG_TEST_ID);
    const unsafeDiv = systemMsg.querySelector('[data-unsafe-inner-html]');
    expect(unsafeDiv).toBeInTheDocument();
    expect(unsafeDiv.innerHTML).toBe('<strong>html event</strong>');
  });

  it('should render system event text content (no timestamp displayed)', async () => {
    await renderComponent({
      props: { message: { ...message, text: 'a system message' } },
    });
    const systemMsg = screen.getByTestId(SYSTEM_MSG_TEST_ID);
    expect(systemMsg).toHaveTextContent('a system message');
    // Component no longer renders timestamps
    expect(
      systemMsg.querySelector('.str-chat__message--system__date'),
    ).not.toBeInTheDocument();
  });

  describe('Channel events', () => {
    it('should render null for member add event (channel events no longer rendered)', () => {
      const msg = {
        created_at: '2020-01-13T18:18:38.148025Z',
        event: {
          type: 'member.added',
          user: { id: 'user_id', image: 'image_url', username: 'username' },
        },
        type: 'channel.event',
      };

      const { container } = render(<EventComponent message={msg} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('should render null for member remove event (channel events no longer rendered)', () => {
      const msg = {
        created_at: '2020-01-13T18:18:38.148025Z',
        event: {
          type: 'member.removed',
          user: { id: 'user_id', image: 'image_url', username: 'username' },
        },
        type: 'channel.event',
      };

      const { container } = render(<EventComponent message={msg} />);
      expect(container).toBeEmptyDOMElement();
    });
  });
});
