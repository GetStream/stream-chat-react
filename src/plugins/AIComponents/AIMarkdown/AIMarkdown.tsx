import React, {
  Children,
  type ComponentProps,
  type ComponentType,
  type ElementType,
  isValidElement,
  useContext,
  useMemo,
} from 'react';
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism, type SyntaxHighlighterProps } from 'react-syntax-highlighter';
import clsx from 'clsx';

import { SuspendedChart } from './tools/charts/SuspendedChart';

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

// true inside a plain (language-less) <pre>: lets DefaultCode tell a fenced
// block without a language from inline code (react-markdown v9 has no `inline`)
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

    // grab from pre-registered component set and render
    const Component =
      typeof toolOrLanguage === 'string' ? toolComponents[toolOrLanguage] : null;

    if (Component) {
      // TODO: forward metadata

      return (
        <Component data={codeElement.props.children as string} fallback={fallback} />
      );
    }

    // render just a fragment with the code content
    // which gets replaced by SyntaxHighlighter (it itself renders pre too)
    if (toolOrLanguage) {
      return fallback;
    }
  }

  // treat as regular pre/code block if there's no tool/language
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

const DefaultComponents = {
  code: DefaultCode,
  pre: DefaultPre,
} as const;

interface AIMarkdown {
  (props: {
    children: string;
    toolComponents?: ToolComponents;
    markdownComponents?: MarkdownComponents;
  }): React.JSX.Element;
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
      json: SuspendedChart,
      ...props.toolComponents,
    }),
    [props.toolComponents],
  );

  return (
    <AIMarkdownContext.Provider value={{ toolComponents: mergedToolComponents }}>
      <ReactMarkdown components={mergedMarkdownComponents} remarkPlugins={[remarkGfm]}>
        {props.children}
      </ReactMarkdown>
    </AIMarkdownContext.Provider>
  );
};

AIMarkdown.default = DefaultComponents;
