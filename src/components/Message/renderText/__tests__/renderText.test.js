import React from 'react';
import renderer from 'react-test-renderer';
import { defaultAllowedTagNames, renderText } from '../renderText';
import { findAndReplace } from 'hast-util-find-and-replace';
import { u } from 'unist-builder';

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

  it('parses user mention to default format', () => {
    const Markdown = renderText('@username@email.com', [
      { id: 'id-username@email.com', name: 'username@email.com' },
    ]);
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <p>
        <span
          className="str-chat__message-mention"
          data-user-id="id-username@email.com"
        >
          @username@email.com
        </span>
      </p>
    `);
  });

  it('allows to override rehype plugins', () => {
    const customPlugin = () => (tree) => tree;
    const getRehypePlugins = () => [customPlugin];
    const Markdown = renderText(
      '@username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
      { getRehypePlugins },
    );
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <p>
        @
        <a
          className=""
          href="mailto:username@email.com"
          rel="nofollow noreferrer noopener"
          target="_blank"
        >
          username@email.com
        </a>
      </p>
    `);
  });

  it('allows to merge custom rehype plugins followed by default rehype plugins', () => {
    const customPlugin = () => (tree) => findAndReplace(tree, /.*@.*/, () => u('text', '#'));
    const getRehypePlugins = (defaultPlugins) => [customPlugin, ...defaultPlugins];
    const Markdown = renderText(
      '@username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
      { getRehypePlugins },
    );
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <p>
        #
        <a
          className=""
          href="mailto:username@email.com"
          rel="nofollow noreferrer noopener"
          target="_blank"
        >
          #
        </a>
      </p>
    `);
  });

  it('allows to merge default rehype plugins followed by custom rehype plugins', () => {
    const customPlugin = () => (tree) => findAndReplace(tree, /.*@.*/, () => u('text', '#'));
    const getRehypePlugins = (defaultPlugins) => [...defaultPlugins, customPlugin];
    const Markdown = renderText(
      '@username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
      { getRehypePlugins },
    );
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <p>
        <span
          className="str-chat__message-mention"
          data-user-id="id-username@email.com"
        >
          #
        </span>
      </p>
    `);
  });

  const strikeThroughText = '~~xxx~~';
  it('renders strikethrough', () => {
    const Markdown = renderText(strikeThroughText);
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <p>
        <del>
          xxx
        </del>
      </p>
    `);
  });

  it('allows to override remark plugins', () => {
    const customPlugin = () => (tree) => tree;
    const getRemarkPlugins = () => [customPlugin];
    const Markdown = renderText(strikeThroughText, [], { getRemarkPlugins });
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <p>
        ~~xxx~~
      </p>
    `);
  });

  it('executes remark-gfm before the custom remark plugins are executed', () => {
    const replace = () => u('text', '#');
    const customPlugin = () => (tree) =>
      findAndReplace(tree, new RegExp(strikeThroughText), replace);

    const getRemarkPluginsFirstCustom = (defaultPlugins) => [customPlugin, ...defaultPlugins];
    const getRemarkPluginsFirstDefault = (defaultPlugins) => [...defaultPlugins, customPlugin];
    [getRemarkPluginsFirstCustom, getRemarkPluginsFirstDefault].forEach((getRemarkPlugins) => {
      const Markdown = renderText(strikeThroughText, [], {
        getRemarkPlugins,
      });
      const tree = renderer.create(Markdown).toJSON();
      expect(tree).toMatchInlineSnapshot(`
              <p>
                <del>
                  xxx
                </del>
              </p>
          `);
    });
  });

  it('allows to render custom elements', () => {
    const customTagName = 'xxx';
    const text = 'a b c';
    const replace = (match) => u('element', { tagName: customTagName }, [u('text', match)]);
    const customPlugin = () => (tree) => findAndReplace(tree, /b/, replace);
    const getRehypePlugins = (defaultPlugins) => [customPlugin, ...defaultPlugins];
    const Markdown = renderText(text, [], {
      allowedTagNames: [...defaultAllowedTagNames, customTagName],
      getRehypePlugins,
    });
    const tree = renderer.create(Markdown).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <p>
        a 
        <xxx>
          b
        </xxx>
         c
      </p>
    `);
  });
});