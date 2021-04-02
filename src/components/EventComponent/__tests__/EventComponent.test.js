import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EventComponent } from '../EventComponent';

jest.mock('../../Avatar', () => ({
  Avatar: jest.fn(({ image = '', name = '' }) => (
    <img data-testid='avatar' name={name} src={image} />
  )),
}));

describe('EventComponent', () => {
  afterEach(cleanup);

  it('should render null for empty message', () => {
    const tree = renderer.create(<EventComponent message={{}} />).toJSON();
    expect(tree).toMatchInlineSnapshot(`null`);
  });

  it('should render system events', () => {
    const message = {
      created_at: '2020-03-13T10:18:38.148025Z',
      text: 'system event',
      type: 'system',
    };

    const tree = renderer.create(<EventComponent message={message} />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__message--system"
      >
        <div
          className="str-chat__message--system__text"
        >
          <div
            className="str-chat__message--system__line"
          />
          <p>
            system event
          </p>
          <div
            className="str-chat__message--system__line"
          />
        </div>
        <div
          className="str-chat__message--system__date"
        >
          <strong>
            Friday
             
          </strong>
          at 
          10:18 AM
        </div>
      </div>
    `);
  });

  describe('Channel events', () => {
    it('should render message for member add event', () => {
      const message = {
        created_at: '2020-01-13T18:18:38.148025Z',
        event: {
          type: 'member.added',
          user: { id: 'user_id', image: 'image_url', username: 'username' },
        },
        type: 'channel.event',
      };

      const tree = renderer.create(<EventComponent message={message} />).toJSON();
      expect(tree).toMatchInlineSnapshot(`
        <div
          className="str-chat__event-component__channel-event"
        >
          <img
            data-testid="avatar"
            name="user_id"
            src="image_url"
          />
          <div
            className="str-chat__event-component__channel-event__content"
          >
            <em
              className="str-chat__event-component__channel-event__sentence"
            >
              user_id has joined the chat
            </em>
            <div
              className="str-chat__event-component__channel-event__date"
            >
              6:18 PM
            </div>
          </div>
        </div>
      `);
    });

    it('should render message for member remove event', () => {
      const message = {
        created_at: '2020-01-13T18:18:38.148025Z',
        event: {
          type: 'member.removed',
          user: { id: 'user_id', image: 'image_url', username: 'username' },
        },
        type: 'channel.event',
      };

      const tree = renderer.create(<EventComponent message={message} />).toJSON();
      expect(tree).toMatchInlineSnapshot(`
        <div
          className="str-chat__event-component__channel-event"
        >
          <img
            data-testid="avatar"
            name="user_id"
            src="image_url"
          />
          <div
            className="str-chat__event-component__channel-event__content"
          >
            <em
              className="str-chat__event-component__channel-event__sentence"
            >
              user_id was removed from the chat
            </em>
            <div
              className="str-chat__event-component__channel-event__date"
            >
              6:18 PM
            </div>
          </div>
        </div>
      `);
    });
  });
});
