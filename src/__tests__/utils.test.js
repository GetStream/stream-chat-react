import React from 'react';
import renderer from 'react-test-renderer';
import { renderText } from '../utils';

describe(`renderText`, () => {
  it('handles the special case where user name matches to an e-mail pattern - 1', () => {
    const Markdown = renderText(
      'Hello @username@email.com, is username@email.com your @primary e-mail?',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
    );
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles the special case where user name matches to an e-mail pattern - 2', () => {
    const Markdown = renderText(
      'username@email.com @username@email.com is this the right address?',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
    );
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles the special case where user name matches to an e-mail pattern - 3', () => {
    const Markdown = renderText(
      '@username@email.com @username@email.com @username@email.com @username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
    );
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles the special case where user name matches to an e-mail pattern - 4', () => {
    const Markdown = renderText(
      '@username@email.com @username@email.com username@email.com @username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
    );
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders custom mention', () => {
    const Markdown = renderText(
      '@username@email.com @username@email.com username@email.com @username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
      {
        customMarkDownRenderers: {
          mention: function MyMention(props) {
            return <span className='my-mention'>{props.children}</span>;
          },
        },
      },
    );
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders standard markdown text', () => {
    const Markdown = renderText('Hi, shall we meet on **Tuesday**?', []);
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
