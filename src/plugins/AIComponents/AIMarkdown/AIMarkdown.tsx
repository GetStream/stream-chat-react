import React, {
  Children,
  type ComponentProps,
  type ComponentType,
  type ElementType,
  isValidElement,
  useContext,
  useMemo,
} from 'react';
import ReactMarkdown, {
  type Components,
  type ExtraProps,
} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism, type SyntaxHighlighterProps } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import clsx from 'clsx';

import { SuspendedChart } from './tools/charts/suspended';

const SyntaxHighlighter =
  Prism as unknown as ComponentType<SyntaxHighlighterProps>;

const getToolOrLanguage = (className: string = '') => {
  return className.match(/language-(?<tool>[\w-]+)/)?.groups?.['tool'];
};

type ToolComponents = {
  [key in string]?: ComponentType<{
    data: string;
    fallback: React.ReactNode;
  }>;
};

type ToolComponent = NonNullable<ToolComponents[string]>;

export type ToolComponentProps =
  ToolComponent extends ComponentType<infer P> ? P : never;

type MarkdownComponents = Components;

const AIMarkdownContext = React.createContext<{
  toolComponents: ToolComponents;
}>({ toolComponents: {} });

type BaseDefaultPreProps = ComponentProps<'pre'> & ExtraProps;

type DefaultPreProps = BaseDefaultPreProps & {
  Pre?: ComponentType<BaseDefaultPreProps> | ElementType;
};

const DefaultPre = (props: DefaultPreProps) => {
  const { children, className, Pre = 'pre', ...restProps } = props;

  const { toolComponents } = useContext(AIMarkdownContext);

  const [codeElement] = Children.toArray(children);

  if (
    isValidElement(codeElement) &&
    codeElement.props.node.tagName === 'code'
  ) {
    const toolOrLanguage = getToolOrLanguage(codeElement.props.className);

    const fallback = <>{children}</>;

    // grab from pre-registered component set and render
    const Component =
      typeof toolOrLanguage === 'string'
        ? toolComponents[toolOrLanguage]
        : null;

    if (Component) {
      // TODO: forward metadata

      return (
        <Component
          fallback={fallback}
          data={codeElement.props.children as string}
        />
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
    <Pre className={clsx(className, 'aicr__pre')} {...restProps}>
      {children}
    </Pre>
  );
};

const Code = ({
  children,
  className,
  style: _style,
  ...restProps
}: ComponentProps<'code'>) => {
  return (
    <code
      className={clsx('aicr__syntax-highlighter-code', className)}
      {...restProps}
    >
      {children}
    </code>
  );
};

const Pre = ({ children, className, ...restProps }: ComponentProps<'pre'>) => {
  return (
    <pre
      className={clsx('aicr__syntax-highlighter-pre', className)}
      {...restProps}
    >
      {children}
    </pre>
  );
};

const DefaultSyntaxHighlighter = ({
  children,
  language,
}: BaseDefaultCodeProps) => {
  return (
    <SyntaxHighlighter
      CodeTag={Code as ComponentType<any>}
      PreTag={Pre as ComponentType<any>}
      useInlineStyles={false}
      style={oneLight}
      showLineNumbers
      language={language}
    >
      {children as string}
    </SyntaxHighlighter>
  );
};

type BaseDefaultCodeProps = ComponentProps<'code'> &
  ExtraProps & { language?: string; inline?: boolean };

type DefaultCodeProps = BaseDefaultCodeProps & {
  Code?: ComponentType<BaseDefaultCodeProps> | ElementType;
  SyntaxHighlighter?: ComponentType<BaseDefaultCodeProps>;
};

const DefaultCode = (props: DefaultCodeProps) => {
  const {
    node,
    className,
    children,
    SyntaxHighlighter = DefaultSyntaxHighlighter,
    Code = 'code',
    ...restProps
  } = props;

  const language = getToolOrLanguage(className);
  const inline = !language;

  const Component = inline ? Code : SyntaxHighlighter;

  return (
    <Component
      className={clsx(className, 'aicr__code')}
      node={node}
      {...(typeof Component === 'string'
        ? {
            'data-inline': inline ? 'true' : 'false',
            'data-language': language,
          }
        : { inline, language })}
      {...restProps}
    >
      {children}
    </Component>
  );
};

const DefaultComponents = {
  pre: DefaultPre,
  code: DefaultCode,
} as const;

interface AIMarkdown {
  (props: {
    children: string;
    toolComponents?: ToolComponents;
    markdownComponents?: MarkdownComponents;
  }): JSX.Element;
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
    <AIMarkdownContext.Provider
      value={{ toolComponents: mergedToolComponents }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={mergedMarkdownComponents}
      >
        {props.children}
      </ReactMarkdown>
    </AIMarkdownContext.Provider>
  );
};

AIMarkdown.default = DefaultComponents;
