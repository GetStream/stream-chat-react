// The part of the OpenUI renderer that runs the official OpenUI packages. It loads when a reply
// first shows OpenUI: the component library is large, and of no use to an app whose agent never
// writes OpenUI.
import React, {
  createContext,
  type MouseEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type ActionEvent,
  BuiltinActionType,
  defineComponent,
  type OpenUIError as LangError,
  type Library,
  Renderer,
} from '@openuidev/react-lang';
import {
  openuiChatLibrary,
  openuiChatPromptOptions,
} from '@openuidev/react-ui/genui-lib';
import { z } from 'zod/v4';

import {
  type AIUIComponent,
  AIUIComponentView,
} from '../AIComponents/GenerativeUI/AIUIComponent';
import type { AIUIComponentDefinition } from '../AIComponents/GenerativeUI/AIUIComponentDefinition';
import {
  type AIUIDocument,
  aiUIDocumentText,
} from '../AIComponents/GenerativeUI/AIUIDocument';
import type { OpenUIEngine, OpenUIError } from './OpenUIRenderer';

/** A library of OpenUI components, as `createLibrary` of `@openuidev/react-lang` makes one. */
export type OpenUILibrary = Library;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The OpenUI type of one of the app's components, named as the library names its own. */
export const openUITypeName = (name: string) =>
  name
    .split(/[_\- ]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const sentence = (text: string) => {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

/**
 * What an app's component is for, as the agent reads it: what it shows, what each parameter
 * holds, since OpenUI passes them by position and its signatures name only their types, and
 * what its events do, since it reports them itself. As StreamChatOpenUI describes it.
 */
export const openUIDescriptionOf = ({
  description,
  events,
  parameters,
}: AIUIComponentDefinition) =>
  [
    description,
    ...parameters.flatMap(({ description: about, name }) =>
      about ? [`${name}: ${about}`] : [],
    ),
    ...events.map((event) => event.description),
  ]
    .filter((note) => note.trim() !== '')
    .map(sentence)
    .join(' ');

/** An app's component's parameters as the props of an OpenUI component, in their order. */
export const openUIPropsOf = ({ parameters }: AIUIComponentDefinition) =>
  z.object(
    Object.fromEntries(
      parameters.map(({ isRequired, name, type }) => {
        const schema = z.fromJSONSchema(type as never);
        return [name, isRequired ? schema : schema.optional()];
      }),
    ),
  );

// The props of the library's components that hold its content, such as a Card's children or a
// TabItem's content, which the app's components join: the ones that already take TextContent.
const contentSlotsOf = (library: Library) => {
  const { $defs } = library.toJSONSchema() as {
    $defs?: Record<string, { properties?: Record<string, unknown> }>;
  };
  return Object.entries($defs ?? {}).flatMap(([name, schema]) =>
    Object.entries(schema.properties ?? {})
      .filter(([, prop]) => JSON.stringify(prop).includes('"#/$defs/TextContent"'))
      .map(([prop]) => `${name}.${prop}`),
  );
};

type ReplyContextValue = {
  engine: OpenUIEngine;
  isStreaming: boolean;
  messageId: string;
};

const OpenUIReplyContext = createContext<ReplyContextValue | undefined>(undefined);

// One of the app's components where the agent placed it in a reply's program.
const PlacedComponent = ({
  component,
  props,
}: {
  component: AIUIComponent;
  props: Record<string, unknown>;
}) => {
  const reply = useContext(OpenUIReplyContext);
  if (!reply) return null;
  const { engine, isStreaming, messageId } = reply;
  const { name } = component.definition;
  // A prop the agent left out is no argument, rather than one of no value.
  const args = Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined && value !== null),
  );
  return (
    <AIUIComponentView
      args={args}
      component={component}
      context={{
        emit: (event, label, payload = {}) =>
          void engine.host.send({
            format: 'openui',
            label,
            messageId,
            name: event,
            payload: { ...payload, component: name },
          }),
        host: engine.host,
        isStreaming,
        messageId,
      }}
    />
  );
};

// The app's components as OpenUI components, each where the library's own content goes. One
// whose parameters OpenUI can't take, or whose name the library already has, is left out, so it
// never replaces one of the library's own.
const withAppComponents = (
  library: Library,
  components: AIUIComponent[],
  report?: (error: OpenUIError) => void,
): Library => {
  const taken = new Set(Object.keys(library.components));
  const slots = contentSlotsOf(library);
  const added = components.flatMap((component) => {
    const name = openUITypeName(component.definition.name);
    if (taken.has(name)) {
      report?.({
        code: 'component-name-taken',
        component: name,
        message: `The component ${component.definition.name} is left out of OpenUI: its name ${name} is taken`,
      });
      return [];
    }
    try {
      const defined = defineComponent({
        component: ({ props }) => (
          <PlacedComponent
            component={component}
            props={props as Record<string, unknown>}
          />
        ),
        description: openUIDescriptionOf(component.definition),
        name,
        props: openUIPropsOf(component.definition),
      });
      taken.add(name);
      return [{ component: defined, slots }];
    } catch (error) {
      report?.({
        code: 'component-error',
        component: name,
        message: `The component ${component.definition.name} can't join OpenUI: ${String(error)}`,
      });
      return [];
    }
  });
  if (added.length === 0 || !library.extend) return library;
  return library.extend({ components: { add: added } });
};

const librariesByEngine = new WeakMap<OpenUIEngine, Library>();

/** The library a conversation's replies are written with: the renderer's, with the app's components. */
export const libraryOf = (engine: OpenUIEngine) => {
  let library = librariesByEngine.get(engine);
  if (!library) {
    library = withAppComponents(
      engine.options.library ?? openuiChatLibrary,
      engine.host.components,
      (error) => engine.report(error, ''),
    );
    librariesByEngine.set(engine, library);
  }
  return library;
};

/** The instructions that teach a model to write OpenUI with `library` and `components`. */
export const instructionsFor = (components: AIUIComponent[], library?: Library) =>
  library
    ? withAppComponents(library, components).prompt()
    : withAppComponents(openuiChatLibrary, components).prompt(openuiChatPromptOptions);

// A form's values without the fields OpenUI marks secret, such as a password, which never go
// to the agent.
const withoutSecrets = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (!isRecord(item)) return [[key, item]];
      if (item.secret === true) return [];
      return [[key, withoutSecrets(item)]];
    }),
  );

/**
 * What the person did, as the action that tells the agent, in StreamChatOpenUI's shape: a
 * button or follow-up continues the conversation with its words as the label, and carries the
 * step's `context`, any other params, and the values of the form it belongs to. A link opens
 * the way the host allows instead.
 */
export const actOn = (engine: OpenUIEngine, messageId: string, event: ActionEvent) => {
  if (event.type === BuiltinActionType.OpenUrl) {
    const { url } = event.params;
    if (typeof url === 'string') engine.host.open(url);
    return;
  }
  const { context, ...params } = event.params;
  const values = event.formName && event.formState ? withoutSecrets(event.formState) : {};
  const label =
    event.humanFriendlyMessage ||
    (typeof context === 'string' && context !== '' ? context : event.type);
  void engine.host.send({
    format: 'openui',
    label,
    messageId,
    name: event.type,
    payload: {
      ...(context === undefined ? {} : { context }),
      ...(Object.keys(params).length ? { params } : {}),
      ...(event.formName ? { form: event.formName } : {}),
      ...(Object.keys(values).length ? { values } : {}),
    },
  });
};

const errorOf = ({ code, component, message, statementId }: LangError): OpenUIError => ({
  code,
  message,
  ...(component ? { component } : {}),
  ...(statementId ? { statementId } : {}),
});

const reportedByEngine = new WeakMap<OpenUIEngine, Map<string, Set<string>>>();

// Each error of a reply once, and only once the reply is written: while it streams, a program
// is unfinished, and what it lacks is still coming.
const reportOnce = (engine: OpenUIEngine, messageId: string, errors: LangError[]) => {
  let replies = reportedByEngine.get(engine);
  if (!replies) reportedByEngine.set(engine, (replies = new Map()));
  let reported = replies.get(messageId);
  if (!reported) replies.set(messageId, (reported = new Set()));
  for (const error of errors) {
    if (error.severity === 'warning') continue;
    const key = [error.code, error.message, error.statementId].join('\u0000');
    if (reported.has(key)) continue;
    reported.add(key);
    engine.report(errorOf(error), messageId);
  }
};

/** A reply's UI, following its program as the agent writes it. */
export const OpenUIReplyContent = ({
  document,
  engine,
  messageId,
}: {
  document: AIUIDocument;
  engine: OpenUIEngine;
  messageId: string;
}) => {
  const library = libraryOf(engine);
  const { isStreaming } = document;
  const program = aiUIDocumentText(document) ?? '';
  const errors = useRef<LangError[]>([]);
  const reply = useMemo(
    () => ({ engine, isStreaming, messageId }),
    [engine, isStreaming, messageId],
  );
  // What the person entered, kept by the host, so it survives scrolling and remounts.
  const [initialState] = useState(() => {
    const kept = engine.host.state(messageId);
    return isRecord(kept) ? kept : undefined;
  });
  // The tools a program's Query() and Mutation() run: the renderer's, else the host's.
  const toolProvider = useMemo(
    () =>
      engine.options.toolProvider ??
      Object.fromEntries(
        engine.host.toolNames.map((name) => [
          name,
          (args: Record<string, unknown>) => engine.host.runTool(name, args),
        ]),
      ),
    [engine],
  );
  useEffect(() => {
    if (!isStreaming) reportOnce(engine, messageId, errors.current);
  }, [engine, isStreaming, messageId, program]);
  const follow = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest?.('a[href]');
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    engine.host.open(link.getAttribute('href') ?? '');
  };
  return (
    <OpenUIReplyContext.Provider value={reply}>
      <div
        className='str-chat__openui'
        onAuxClickCapture={follow}
        onClickCapture={follow}
      >
        <Renderer
          initialState={initialState}
          isStreaming={isStreaming}
          library={library}
          onAction={(event) => actOn(engine, messageId, event)}
          onError={(found) => {
            errors.current = found;
            if (!isStreaming) reportOnce(engine, messageId, found);
          }}
          onStateUpdate={(state) => engine.host.setState(messageId, state)}
          response={program}
          toolProvider={toolProvider}
        />
      </div>
    </OpenUIReplyContext.Provider>
  );
};

/** What the renderer's entry reaches once the runtime loads. */
export type OpenUIRuntime = {
  instructionsFor: typeof instructionsFor;
  OpenUIReplyContent: typeof OpenUIReplyContent;
};
