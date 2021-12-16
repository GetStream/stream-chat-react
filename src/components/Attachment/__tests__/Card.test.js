import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Card } from '../Card';

afterEach(cleanup); // eslint-disable-line

describe('Card', () => {
  it('should render Card with default props', () => {
    const tree = renderer.create(<Card />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"
      >
        <div
          className="str-chat__message-attachment-card--content"
        >
          <div
            className="str-chat__message-attachment-card--text"
          >
            this content could not be displayed
          </div>
        </div>
      </div>
    `);
  });

  it('should render Card with default props and image_url', () => {
    const tree = renderer.create(<Card image_url='test.jpg' />).toJSON();
    expect(tree).toMatchInlineSnapshot(`null`);
  });

  it('should render Card with default props and title', () => {
    const tree = renderer.create(<Card title='test' />).toJSON();
    expect(tree).toMatchInlineSnapshot(`null`);
  });

  it('should render Card with default props and og_scrape_url', () => {
    const tree = renderer.create(<Card og_scrape_url='https://google.com' />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"
      >
        <div
          className="str-chat__message-attachment-card--content"
        >
          <div
            className="str-chat__message-attachment-card--text"
          >
            this content could not be displayed
          </div>
        </div>
      </div>
    `);
  });

  it('should render Card with default props and title and og_scrape_url', () => {
    const tree = renderer.create(<Card og_scrape_url='https://google.com' title='test' />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"
      >
        <div
          className="str-chat__message-attachment-card--content"
        >
          <div
            className="str-chat__message-attachment-card--flex"
          >
            <div
              className="str-chat__message-attachment-card--title"
            >
              test
            </div>
            <a
              aria-label="Attachment"
              className="str-chat__message-attachment-card--url"
              href="https://google.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              google.com
            </a>
          </div>
        </div>
      </div>
    `);
  });

  it('should render Card with default props and title, og_scrape_url, image_url', () => {
    const tree = renderer
      .create(<Card image_url='test.jpg' og_scrape_url='https://google.com' title='test' />)
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"
      >
        <div
          className="str-chat__message-attachment-card--header"
        >
          <img
            alt="test.jpg"
            src="test.jpg"
          />
        </div>
        <div
          className="str-chat__message-attachment-card--content"
        >
          <div
            className="str-chat__message-attachment-card--flex"
          >
            <div
              className="str-chat__message-attachment-card--title"
            >
              test
            </div>
            <a
              aria-label="Attachment"
              className="str-chat__message-attachment-card--url"
              href="https://google.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              google.com
            </a>
          </div>
        </div>
      </div>
    `);
  });

  it('should render Card with default props and title, og_scrape_url, image_url, text', () => {
    const tree = renderer
      .create(
        <Card
          image_url='test.jpg'
          og_scrape_url='https://google.com'
          text='test text'
          title='test'
        />,
      )
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"
      >
        <div
          className="str-chat__message-attachment-card--header"
        >
          <img
            alt="test.jpg"
            src="test.jpg"
          />
        </div>
        <div
          className="str-chat__message-attachment-card--content"
        >
          <div
            className="str-chat__message-attachment-card--flex"
          >
            <div
              className="str-chat__message-attachment-card--title"
            >
              test
            </div>
            <div
              className="str-chat__message-attachment-card--text"
            >
              test text
            </div>
            <a
              aria-label="Attachment"
              className="str-chat__message-attachment-card--url"
              href="https://google.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              google.com
            </a>
          </div>
        </div>
      </div>
    `);
  });

  it('should render trimmed url', () => {
    const { getByText } = render(
      <Card
        og_scrape_url='https://www.theverge.com/2020/6/15/21291288/sony-ps5-software-user-interface-ui-design-dashboard-teaser-video'
        title='test'
      />,
    );
    expect(getByText('theverge.com')).toBeInTheDocument();
  });

  it('should return null if no og_scrape_url && no title_link', () => {
    const { container } = render(<Card title='test card' />);
    expect(container).toBeEmptyDOMElement();
  });
});
