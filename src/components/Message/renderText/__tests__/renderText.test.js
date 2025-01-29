import React from 'react';
import { findAndReplace } from 'hast-util-find-and-replace';
import { u } from 'unist-builder';
import { render } from '@testing-library/react';
import { htmlToTextPlugin, keepLineBreaksPlugin } from '../remarkPlugins';
import { defaultAllowedTagNames, renderText } from '../renderText';

const strikeThroughText = '~~xxx~~';

describe(`renderText`, () => {
  it('handles the special case where user name matches to an e-mail pattern - 1', () => {
    const Markdown = renderText(
      'Hello @username@email.com, is username@email.com your @primary e-mail?',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
    );
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it('handles the special case where user name matches to an e-mail pattern - 2', () => {
    const Markdown = renderText(
      'username@email.com @username@email.com is this the right address?',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
    );
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it('handles the special case where user name matches to an e-mail pattern - 3', () => {
    const Markdown = renderText(
      '@username@email.com @username@email.com @username@email.com @username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
    );
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it('handles the special case where user name matches to an e-mail pattern - 4', () => {
    const Markdown = renderText(
      '@username@email.com @username@email.com username@email.com @username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
    );
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it('renders custom mention', () => {
    const CustomMention = (props) => (
      <span
        className='my-mention'
        data-node-mentioned-user-id={props.node.mentionedUser.id}
      >
        {props.children}
      </span>
    );
    const Markdown = renderText(
      '@username@email.com @username@email.com username@email.com @username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
      {
        customMarkDownRenderers: {
          mention: CustomMention,
        },
      },
    );
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it('renders standard markdown text', () => {
    const Markdown = renderText('Hi, shall we meet on **Tuesday**?', []);
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it('renders remark-gfm list and strikethrough correctly', () => {
    const Markdown = renderText(
      'Pick a time to meet:\n- Wednesday\n- Thursday\n- ~~Sunday~~\n- ~Monday~\n',
      [],
    );
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it("handles the special case where there's at least one mention and @ symbol at the end", () => {
    const Markdown = renderText('@username@email.com @', [
      { id: 'id-username@email.com', name: 'username@email.com' },
    ]);
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it('handles the special case where there are pronouns in the name', () => {
    const Markdown = renderText('hey, @John (they/them), how are you?', [
      { id: 'john', name: 'John (they/them)' },
    ]);
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it('handles the special case where there is a forward slash in the name', () => {
    const Markdown = renderText('hey, @John/Cena, how are you?', [
      { id: 'john', name: 'John/Cena' },
    ]);
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it('handles the special case where there is a backslash in the name', () => {
    const Markdown = renderText('hey, @John\\Cena, how are you?', [
      { id: 'john', name: 'John\\Cena' },
    ]);
    const { container } = render(Markdown);
    expect(container).toMatchSnapshot();
  });

  it('parses user mention to default format', () => {
    const Markdown = renderText('@username@email.com', [
      { id: 'id-username@email.com', name: 'username@email.com' },
    ]);
    const { container } = render(Markdown);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          <span
            class="str-chat__message-mention"
            data-user-id="id-username@email.com"
          >
            @username@email.com
          </span>
        </p>
      </div>
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
    const { container } = render(Markdown);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          @
          <a
            class=""
            href="mailto:username@email.com"
            rel="nofollow noreferrer noopener"
            target="_blank"
          >
            username@email.com
          </a>
        </p>
      </div>
    `);
  });

  it('allows to merge custom rehype plugins followed by default rehype plugins', () => {
    const customPlugin = () => (tree) =>
      findAndReplace(tree, [/.*@.*/, () => u('text', '#')]);
    const getRehypePlugins = (defaultPlugins) => [customPlugin, ...defaultPlugins];
    const Markdown = renderText(
      '@username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
      { getRehypePlugins },
    );
    const { container } = render(Markdown);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          #
          <a
            class=""
            href="mailto:username@email.com"
            rel="nofollow noreferrer noopener"
            target="_blank"
          >
            #
          </a>
        </p>
      </div>
    `);
  });

  it('allows to merge default rehype plugins followed by custom rehype plugins', () => {
    const customPlugin = () => (tree) =>
      findAndReplace(tree, [/.*@.*/, () => u('text', '#')]);
    const getRehypePlugins = (defaultPlugins) => [...defaultPlugins, customPlugin];
    const Markdown = renderText(
      '@username@email.com',
      [{ id: 'id-username@email.com', name: 'username@email.com' }],
      { getRehypePlugins },
    );
    const { container } = render(Markdown);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          <span
            class="str-chat__message-mention"
            data-user-id="id-username@email.com"
          >
            #
          </span>
        </p>
      </div>
    `);
  });

  it('renders strikethrough', () => {
    const Markdown = renderText(strikeThroughText);
    const { container } = render(Markdown);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          <del>
            xxx
          </del>
        </p>
      </div>
    `);
  });

  it('allows to override remark plugins', () => {
    const customPlugin = () => (tree) => tree;
    const getRemarkPlugins = () => [customPlugin];
    const Markdown = renderText(strikeThroughText, [], { getRemarkPlugins });
    const { container } = render(Markdown);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          ~~xxx~~
        </p>
      </div>
    `);
  });

  it('executes remark-gfm before the custom remark plugins are executed', () => {
    const replace = () => u('text', '#');
    const customPlugin = () => (tree) =>
      findAndReplace(tree, [new RegExp(strikeThroughText), replace]);

    const getRemarkPluginsFirstCustom = (defaultPlugins) => [
      customPlugin,
      ...defaultPlugins,
    ];
    const getRemarkPluginsFirstDefault = (defaultPlugins) => [
      ...defaultPlugins,
      customPlugin,
    ];
    [getRemarkPluginsFirstCustom, getRemarkPluginsFirstDefault].forEach(
      (getRemarkPlugins) => {
        const Markdown = renderText(strikeThroughText, [], {
          getRemarkPlugins,
        });
        const { container } = render(Markdown);
        expect(container.innerHTML).toBe('<p><del>xxx</del></p>');
      },
    );
  });

  it('allows to render custom elements', () => {
    const customTagName = 'xxx';
    const text = 'a b c';
    const replace = (match) =>
      u('element', { properties: {}, tagName: customTagName }, [u('text', match)]);
    const customPlugin = () => (tree) => findAndReplace(tree, [/b/, replace]);
    const getRehypePlugins = (defaultPlugins) => [customPlugin, ...defaultPlugins];
    const Markdown = renderText(text, [], {
      allowedTagNames: [...defaultAllowedTagNames, customTagName],
      getRehypePlugins,
    });
    const { container } = render(Markdown);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          a 
          <xxx>
            b
          </xxx>
           c
        </p>
      </div>
    `);
  });
});

describe('keepLineBreaksPlugin', () => {
  const lineBreaks = '\n\n\n';
  const paragraphText = `a${lineBreaks}b${lineBreaks}c`;
  const unorderedListText = `* item 1${lineBreaks}* item 2${lineBreaks}* item 3`;
  const orderedListText = `1. item 1${lineBreaks}2. item 2${lineBreaks}3. item 3`;
  const headingText = `## Heading${lineBreaks}a`;
  const codeBlockText = 'a\n\n\n```b```\n\n\nc';
  const horizontalRuleText = `a${lineBreaks}---${lineBreaks}b`;
  const blockquoteText = `a${lineBreaks}>b${lineBreaks}c`;
  const withStrikeThroughText = `a${lineBreaks}${strikeThroughText}${lineBreaks}b`;
  const tableText = `a${lineBreaks}| a | b  |  c |  d  |\n| - | :- | -: | :-: |\n| a | b  |  c |  d  |${lineBreaks}c`;
  const multilineWithStrongText = 'This is **the first** line\n\nThis is the second line';

  const doRenderText = (text, present) => {
    const Markdown = renderText(
      text,
      {},
      { getRemarkPlugins: () => (present ? [keepLineBreaksPlugin] : []) },
    );
    return render(Markdown).container;
  };

  describe('absent', () => {
    const present = false;
    it(`does not keep line breaks between paragraphs`, () => {
      const container = doRenderText(paragraphText, present);
      expect(container).toMatchSnapshot();
    });
    it(`does not keep line breaks between the items in an unordered list`, () => {
      const container = doRenderText(unorderedListText, present);
      expect(container).toMatchSnapshot();
    });
    it(`does not keep line breaks between the items in an ordered list`, () => {
      const container = doRenderText(orderedListText, present);
      expect(container).toMatchSnapshot();
    });
    it(`does not keep line breaks under a heading`, () => {
      const container = doRenderText(headingText, present);
      expect(container).toMatchSnapshot();
    });
    it(`does not keep line breaks around a horizontal rule`, () => {
      const container = doRenderText(horizontalRuleText, present);
      expect(container).toMatchSnapshot();
    });
    it(`does not keep line breaks around a code block`, () => {
      const container = doRenderText(codeBlockText, present);
      expect(container).toMatchSnapshot();
    });
    it(`does not keep line breaks around a blockquote`, () => {
      const container = doRenderText(blockquoteText, present);
      expect(container).toMatchSnapshot();
    });
    it(`does not keep line breaks around a strikethrough`, () => {
      const container = doRenderText(withStrikeThroughText, present);
      expect(container).toMatchSnapshot();
    });
    it(`does not keep line breaks around a table`, () => {
      const container = doRenderText(tableText, present);
      expect(container).toMatchSnapshot();
    });
  });
  describe('present', () => {
    const present = true;
    it(`keeps line breaks between paragraphs`, () => {
      const container = doRenderText(paragraphText, present);
      expect(container).toMatchSnapshot();
    });
    it(`keeps line breaks between the items in an unordered list`, () => {
      const container = doRenderText(unorderedListText, present);
      expect(container).toMatchSnapshot();
    });
    it(`keeps line breaks between the items in an ordered list`, () => {
      const container = doRenderText(orderedListText, present);
      expect(container).toMatchSnapshot();
    });
    it(`keeps line breaks under a heading`, () => {
      const container = doRenderText(headingText, present);
      expect(container).toMatchSnapshot();
    });
    it(`keeps line breaks around a horizontal rule`, () => {
      const container = doRenderText(horizontalRuleText, present);
      expect(container).toMatchSnapshot();
    });
    it(`keeps line breaks around a code block`, () => {
      const container = doRenderText(codeBlockText, present);
      expect(container).toMatchSnapshot();
    });
    it(`keeps line breaks around a blockquote`, () => {
      const container = doRenderText(blockquoteText, present);
      expect(container).toMatchSnapshot();
    });

    it(`keeps line breaks around a strikethrough`, () => {
      const container = doRenderText(withStrikeThroughText, present);
      expect(container).toMatchSnapshot();
    });
    it(`keeps line breaks around a table`, () => {
      const container = doRenderText(tableText, present);
      expect(container).toMatchSnapshot();
    });
    it(`keeps line between lines with strong text`, () => {
      const container = doRenderText(multilineWithStrongText, present);
      expect(container).toMatchSnapshot();
    });
  });
});

describe('htmlToTextPlugin', () => {
  const renderTextWithHtml = (withPlugin) => {
    const textWithHtml = `
<div>
  <script>console.error('This error should not be logged from renderText.test.js!')</script>
</div>
`;
    const Markdown = renderText(
      textWithHtml,
      {},
      { getRemarkPlugins: () => (withPlugin ? [htmlToTextPlugin] : []) },
    );
    return render(Markdown).container;
  };

  it(`absent does not keep HTML in text`, () => {
    const container = renderTextWithHtml(false);
    expect(container).toMatchSnapshot();
  });

  it(`present keeps HTML in text`, () => {
    const container = renderTextWithHtml(true);
    expect(container).toMatchSnapshot();
  });
});
