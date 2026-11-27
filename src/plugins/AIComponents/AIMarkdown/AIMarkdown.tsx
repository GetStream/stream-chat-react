import React, {
  Children,
  Component,
  type ComponentProps,
  type ComponentType,
  type ElementType,
  isValidElement,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { Prism, type SyntaxHighlighterProps } from 'react-syntax-highlighter';
import clsx from 'clsx';

import { JsonChart } from './tools/charts/JsonChart';
import { SuspendedChart } from './tools/charts/SuspendedChart';
import { AIThemeScope } from '../themeScope';
import { Anchor } from '../../../components/Message/renderText/componentRenderers/Anchor';
import { imageToLink } from '../../../components/Message/renderText/remarkPlugins/imageToLink';

type CodeElementProps = {
  children?: React.ReactNode;
  className?: string;
  node?: { tagName?: string };
};

const SyntaxHighlighter = Prism as unknown as ComponentType<SyntaxHighlighterProps>;

const getToolOrLanguage = (className: string = '') =>
  className.match(/language-(?<tool>[\w-]+)/)?.groups?.['tool'];

type ToolComponents = {
  [key in string]?: ComponentType<{
    data: string;
    fallback: React.ReactNode;
  }>;
};

type ToolComponent = NonNullable<ToolComponents[string]>;

export type ToolComponentProps = ToolComponent extends ComponentType<infer P> ? P : never;

type MarkdownComponents = Components;

const AIMarkdownContext = React.createContext<{
  toolComponents: ToolComponents;
}>({ toolComponents: {} });

type BaseDefaultPreProps = ComponentProps<'pre'> & ExtraProps;

type DefaultPreProps = BaseDefaultPreProps & {
  Pre?: ComponentType<BaseDefaultPreProps> | ElementType;
};

// True inside a language-less <pre>, so DefaultCode can tell a fenced block from inline code
// (react-markdown v9 has no `inline` prop).
const InsidePreContext = React.createContext(false);

const DefaultPre = (props: DefaultPreProps) => {
  const { children, className, node, Pre = 'pre', ...restProps } = props;

  const { toolComponents } = useContext(AIMarkdownContext);

  const [codeElement] = Children.toArray(children);

  if (
    isValidElement<CodeElementProps>(codeElement) &&
    codeElement.props.node?.tagName === 'code'
  ) {
    const toolOrLanguage = getToolOrLanguage(codeElement.props.className);

    const fallback = <>{children}</>;

    const Component =
      typeof toolOrLanguage === 'string' ? toolComponents[toolOrLanguage] : null;

    if (Component) {
      // TODO: forward metadata

      return (
        <Component data={codeElement.props.children as string} fallback={fallback} />
      );
    }

    // Only the code content: DefaultCode renders it with SyntaxHighlighter, which adds its own pre.
    if (toolOrLanguage) {
      return fallback;
    }
  }

  // No tool or language: render a regular pre block.
  return (
    <Pre
      className={clsx(className, 'str-chat__ai-pre')}
      // `node` is react-markdown metadata: forward it to components, never to DOM elements
      {...(typeof Pre === 'string' ? {} : { node })}
      {...restProps}
    >
      <InsidePreContext.Provider value={true}>{children}</InsidePreContext.Provider>
    </Pre>
  );
};

const Code = ({
  children,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip `style` so it is not forwarded to <code>
  style: _style,
  ...restProps
}: ComponentProps<'code'>) => (
  <code
    className={clsx('str-chat__ai-syntax-highlighter-code', className)}
    {...restProps}
  >
    {children}
  </code>
);

const Pre = ({ children, className, ...restProps }: ComponentProps<'pre'>) => (
  <pre className={clsx('str-chat__ai-syntax-highlighter-pre', className)} {...restProps}>
    {children}
  </pre>
);

const DefaultSyntaxHighlighter = ({ children, language }: BaseDefaultCodeProps) => (
  <SyntaxHighlighter
    CodeTag={Code as SyntaxHighlighterProps['CodeTag']}
    language={language}
    PreTag={Pre as SyntaxHighlighterProps['PreTag']}
    showLineNumbers
    useInlineStyles={false}
  >
    {children as string}
  </SyntaxHighlighter>
);

type BaseDefaultCodeProps = ComponentProps<'code'> &
  ExtraProps & { language?: string; inline?: boolean };

type DefaultCodeProps = BaseDefaultCodeProps & {
  Code?: ComponentType<BaseDefaultCodeProps> | ElementType;
  SyntaxHighlighter?: ComponentType<BaseDefaultCodeProps>;
};

const DefaultCode = (props: DefaultCodeProps) => {
  const {
    children,
    className,
    Code = 'code',
    node,
    SyntaxHighlighter = DefaultSyntaxHighlighter,
    ...restProps
  } = props;

  const insidePre = useContext(InsidePreContext);
  const language = getToolOrLanguage(className);
  const inline = !language && !insidePre;

  const Component = language ? SyntaxHighlighter : Code;

  return (
    <Component
      className={clsx(className, 'str-chat__ai-code')}
      {...(typeof Component === 'string'
        ? {
            'data-inline': inline ? 'true' : 'false',
            'data-language': language,
          }
        : { inline, language, node })}
      {...restProps}
    >
      {children}
    </Component>
  );
};

/**
 * Shows the reply as its text when a renderer throws, and tries again once the text changes: a
 * reply still streaming in can trip a renderer on a part that isn't written yet, such as half a
 * code fence, and shouldn't stay plain text once the rest arrives.
 */
class AIMarkdownErrorBoundary extends Component<
  PropsWithChildren<{ text: string }>,
  { hasError: boolean; text: string }
> {
  state = { hasError: false, text: this.props.text };

  static getDerivedStateFromProps(
    props: { text: string },
    state: { hasError: boolean; text: string },
  ) {
    return props.text === state.text ? null : { hasError: false, text: props.text };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    return this.state.hasError ? <>{this.props.text}</> : this.props.children;
  }
}

const DefaultComponents = {
  // A link a model writes opens in a new tab, without the page's referrer or a link to it, and
  // only for web and e-mail addresses; any other link is shown as its text.
  a: Anchor,
  code: DefaultCode,
  pre: DefaultPre,
} as const;

// A model's reply is untrusted: an image in it would be fetched as soon as it renders, which lets
// a prompt injection send data out in the image's URL. Images are shown as links to them unless
// the app allows them.
const remarkPlugins: PluggableList = [remarkGfm];
const remarkPluginsWithoutImages: PluggableList = [remarkGfm, imageToLink];

export type AIMarkdownProps = {
  children: string;
  /**
   * Renders the images in the reply. Off by default: an image is fetched as soon as it renders,
   * so a reply could send data to any server in an image URL. Each image is then shown as a link
   * to it instead.
   */
  allowImages?: boolean;
  markdownComponents?: MarkdownComponents;
  toolComponents?: ToolComponents;
};

interface AIMarkdown {
  (props: AIMarkdownProps): React.JSX.Element;
  default: typeof DefaultComponents;
}

export const AIMarkdown: AIMarkdown = (props) => {
  const mergedMarkdownComponents: MarkdownComponents = useMemo(
    () => ({
      ...DefaultComponents,
      ...props.markdownComponents,
    }),
    [props.markdownComponents],
  );

  const mergedToolComponents: ToolComponents = useMemo(
    () => ({
      chartjs: SuspendedChart,
      json: JsonChart,
      ...props.toolComponents,
    }),
    [props.toolComponents],
  );

  return (
    // No single root element of its own, so the scope is a layout-neutral wrapper, added only
    // when nothing above provides one.
    <AIThemeScope>
      <AIMarkdownContext.Provider value={{ toolComponents: mergedToolComponents }}>
        {/* A reply the renderer can't draw is shown as its text rather than breaking the view. */}
        <AIMarkdownErrorBoundary text={props.children}>
          <ReactMarkdown
            components={mergedMarkdownComponents}
            remarkPlugins={props.allowImages ? remarkPlugins : remarkPluginsWithoutImages}
          >
            {props.children}
          </ReactMarkdown>
        </AIMarkdownErrorBoundary>
      </AIMarkdownContext.Provider>
    </AIThemeScope>
  );
};

AIMarkdown.default = DefaultComponents;
