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
            return (
              <span
                className='my-mention'
                // TODO: remove in the next major release
                data-mentioned-user-id={props.mentioned_user.id}
                // TODO: remove in the next major release
                data-node-mentioned-user-id={props.node.mentioned_user.id}
                data-node-mentionedUser-id={props.node.mentionedUser.id}
              >
                {props.children}
              </span>
            );
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

  it('renders remark-gfm list and strikethrough correctly', () => {
    const Markdown = renderText(
      'Pick a time to meet:\n- Wednesday\n- Thursday\n- ~~Sunday~~\n- ~Monday~\n',
      [],
    );
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("handles the special case where there's at least one mention and @ symbol at the end", () => {
    const Markdown = renderText('@username@email.com @', [
      { id: 'id-username@email.com', name: 'username@email.com' },
    ]);
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles the special case where there are pronouns in the name', () => {
    const Markdown = renderText('hey, @John (they/them), how are you?', [
      { id: 'john', name: 'John (they/them)' },
    ]);
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles the special case where there is a forward slash in the name', () => {
    const Markdown = renderText('hey, @John/Cena, how are you?', [
      { id: 'john', name: 'John/Cena' },
    ]);
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles the special case where there is a backslash in the name', () => {
    const Markdown = renderText('hey, @John\\Cena, how are you?', [
      { id: 'john', name: 'John\\Cena' },
    ]);
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
