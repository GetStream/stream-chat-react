// The part of the OpenUI renderer that runs the official OpenUI packages. It loads when a reply
// first shows OpenUI: the component library is large, and of no use to an app whose agent never
// writes OpenUI.
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type ActionEvent,
  BuiltinActionType,
  type ComponentRenderer,
  defineComponent,
  type ElementNode,
  type OpenUIError as LangError,
  type Library,
  type ParseResult,
  type PromptOptions,
  Renderer,
  type ToolSpec,
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
import {
  aiUILinkOpener,
  aiUISentence,
  aiUITypeName,
  aiUIWords,
  isRecord,
  withoutSecretValues,
} from '../AIComponents/GenerativeUI/AIUIHelpers';
import {
  aiUIMediaSource,
  type AIUIMediaURL,
} from '../AIComponents/GenerativeUI/AIUIMedia';
import type { AIUIClientToolDefinition } from '../AIComponents/GenerativeUI/AIUITools';
import type { OpenUIEngine, OpenUIError } from './OpenUIRenderer';

/** A library of OpenUI components, as `createLibrary` of `@openuidev/react-lang` makes one. */
export type OpenUILibrary = Library;

/** The OpenUI type of one of the app's components, named as the library names its own. */
export const openUITypeName = aiUITypeName;

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
    .map(aiUISentence)
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

// Each `src` the agent wrote in a component's props, as `mediaURL` allows it, or left out.
const withMediaSources = (value: unknown, mediaURL: AIUIMediaURL): unknown => {
  if (Array.isArray(value)) return value.map((item) => withMediaSources(item, mediaURL));
  if (!isRecord(value) || value.type === 'element') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === 'src'
        ? (aiUIMediaSource(item, mediaURL) ?? '')
        : withMediaSources(item, mediaURL),
    ]),
  );
};

// The library's components that draw media the agent links to, each loading only what
// `mediaURL` allows, as it is drawn rather than once it is on the page.
const withMediaURL = (library: Library, mediaURL: AIUIMediaURL): Library => {
  if (!library.extend) return library;
  const { $defs } = library.toJSONSchema() as { $defs?: Record<string, unknown> };
  const override = Object.values(library.components)
    .filter((component) =>
      JSON.stringify($defs?.[component.name] ?? {}).includes('"src"'),
    )
    .map((component) => {
      const Draw = component.component as ComponentRenderer;
      return defineComponent({
        component: (({ props, ...rest }) => (
          <Draw {...rest} props={withMediaSources(props, mediaURL) as typeof props} />
        )) as ComponentRenderer,
        description: component.description,
        name: component.name,
        props: component.props,
      });
    });
  return override.length ? library.extend({ components: { override } }) : library;
};

const librariesByEngine = new WeakMap<OpenUIEngine, Library>();

/** The library a conversation's replies are written with: the renderer's, with the app's components. */
export const libraryOf = (engine: OpenUIEngine) => {
  let library = librariesByEngine.get(engine);
  if (!library) {
    library = withMediaURL(
      withAppComponents(
        engine.options.library ?? openuiChatLibrary,
        engine.host.components,
        (error) => engine.report(error),
      ),
      engine.mediaURL,
    );
    librariesByEngine.set(engine, library);
  }
  return library;
};

// One of the app's tools as the model's instructions list it, saying whether a Query can run it.
const toolSpecOf = ({
  description,
  inputSchema,
  name,
  readOnly,
}: AIUIClientToolDefinition): ToolSpec => ({
  annotations: { readOnlyHint: readOnly === true },
  description: [
    description,
    readOnly
      ? 'Read-only: use it in Query() or Mutation().'
      : 'It changes something: use it only in Mutation(), which runs when the person taps.',
  ]
    .filter((part) => part && part.trim() !== '')
    .join(' '),
  inputSchema: inputSchema ?? { type: 'object' },
  name,
  outputSchema: {},
});

/**
 * The instructions that teach a model to write OpenUI with `library` and `components`, call
 * the app's `tools`, and heed the app's own `instructions`, which come first.
 */
export const instructionsFor = (
  components: AIUIComponent[],
  {
    instructions,
    library,
    tools = [],
  }: {
    instructions?: string;
    library?: Library;
    tools?: AIUIClientToolDefinition[];
  } = {},
) => {
  const base: PromptOptions = library ? {} : openuiChatPromptOptions;
  const options: PromptOptions = {
    ...base,
    ...(instructions?.trim()
      ? { preamble: [instructions.trim(), base.preamble].filter(Boolean).join('\n\n') }
      : {}),
    ...(tools.length ? { tools: [...(base.tools ?? []), ...tools.map(toolSpecOf)] } : {}),
  };
  return withAppComponents(library ?? openuiChatLibrary, components).prompt(options);
};

/** The fields of a reply's program the person types secrets in, such as a password. */
export type OpenUISecrets = {
  /** The names of its password inputs. */
  fields: Set<string>;
  /** The `$variables` they are bound to. */
  variables: Set<string>;
};

/** The password inputs of a program as OpenUI read it, and what they are bound to. */
export const secretsOf = (parsed: ParseResult | null): OpenUISecrets => {
  const secrets: OpenUISecrets = { fields: new Set(), variables: new Set() };
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!isRecord(value)) return;
    if (value.type === 'element') {
      const { props, typeName } = value as unknown as ElementNode;
      if (typeName === 'Input' && props.type === 'password') {
        if (typeof props.name === 'string') secrets.fields.add(props.name);
        const bound = props.value;
        if (isRecord(bound) && bound.k === 'StateRef' && typeof bound.n === 'string') {
          secrets.variables.add(bound.n.replace(/^\$/, ''));
        }
      }
      Object.values(props).forEach(visit);
    }
  };
  visit(parsed?.root);
  return secrets;
};

const isSecretKey = (key: string, secrets: OpenUISecrets) =>
  secrets.fields.has(key) || secrets.variables.has(key.replace(/^\$/, ''));

// What the person typed in the program's secret fields, wherever the state holds it.
const secretValuesIn = (state: Record<string, unknown>, secrets: OpenUISecrets) => {
  const values: string[] = [];
  const take = (item: unknown) => {
    const value = isRecord(item) && 'value' in item ? item.value : item;
    if (typeof value === 'string' && value !== '') values.push(value);
  };
  for (const [key, item] of Object.entries(state)) {
    if (isSecretKey(key, secrets)) take(item);
    else if (isRecord(item)) {
      for (const [field, entry] of Object.entries(item)) {
        if (isSecretKey(field, secrets)) take(entry);
      }
    }
  }
  return values;
};

/**
 * A program's state or a form's values without what the person typed in its secret fields,
 * such as a password, which neither reaches the agent nor is kept: the fields are left out, and
 * their values are taken out of anything else that holds them.
 */
export const withoutSecrets = (
  state: Record<string, unknown>,
  secrets: OpenUISecrets,
): Record<string, unknown> => {
  const values = secretValuesIn(state, secrets);
  const kept = Object.fromEntries(
    Object.entries(state).flatMap(([key, item]) => {
      if (isSecretKey(key, secrets)) return [];
      if (!isRecord(item) || 'value' in item) return [[key, item]];
      return [
        [
          key,
          Object.fromEntries(
            Object.entries(item).filter(([field]) => !isSecretKey(field, secrets)),
          ),
        ],
      ];
    }),
  );
  return withoutSecretValues(kept, values);
};

// The words on the control the person last pressed in a reply's UI, which their message says.
type Pressed = { at: number; words: string };

const PRESSABLE = 'button:not([role="tab"]):not([role="option"]), [role="button"]';

/** Whether a click on the reply's UI was on a control, such as a button, with words or without. */
const isControl = (target: EventTarget | null) =>
  !!(target as Element | null)?.closest?.(PRESSABLE);

/** What the person pressed, from a click on the reply's UI, or nothing for what isn't a control. */
export const pressedOf = (target: EventTarget | null): Pressed | undefined => {
  const control = (target as Element | null)?.closest?.(PRESSABLE);
  const words = control?.textContent?.replace(/\s+/g, ' ').trim();
  return words ? { at: Date.now(), words } : undefined;
};

// How long after a press an action still takes its words: one that waits for a Mutation first
// can take a while.
const PRESS_LASTS_MS = 30_000;

/**
 * What the person did, as the action that tells the agent, in StreamChatOpenUI's shape: a
 * button or follow-up continues the conversation with the words of the control they pressed as
 * the label, as they saw them, and carries the step's message for the agent, its `context`, any
 * other params, and the values of the form it belongs to, never what they typed in a secret
 * field. A link opens the way the host allows instead, and an action the library defines but
 * OpenUI doesn't is left out and reported, as the agent has nothing to do with it.
 */
export const actOn = (
  engine: OpenUIEngine,
  messageId: string,
  event: ActionEvent,
  {
    pressed,
    secrets,
    state,
  }: {
    pressed?: Pressed;
    secrets?: OpenUISecrets;
    /**
     * The program's whole state, as OpenUI last gave it. A form's own values leave out the
     * `$variables` its fields are bound to, such as a password's, which can still be in the
     * action's context or message.
     */
    state?: Record<string, unknown>;
  } = {},
) => {
  if (event.type === BuiltinActionType.OpenUrl) {
    const { url } = event.params;
    if (typeof url === 'string') engine.host.open(url);
    return;
  }
  if (event.type !== BuiltinActionType.ContinueConversation) {
    engine.report(
      {
        code: 'unknown-action',
        message: `The action ${event.type} isn't one the agent can take, so it isn't sent`,
      },
      messageId,
    );
    return;
  }
  const hidden = secrets ?? { fields: new Set<string>(), variables: new Set<string>() };
  const typed = secretValuesIn({ ...state, ...event.formState }, hidden);
  const { context, ...params } = withoutSecretValues(event.params, typed);
  const values =
    event.formName && event.formState ? withoutSecrets(event.formState, hidden) : {};
  // The agent's own words for what the person did, which may not be what they saw.
  const message = withoutSecretValues(event.humanFriendlyMessage ?? '', typed).trim();
  const label =
    pressed && Date.now() - pressed.at < PRESS_LASTS_MS
      ? pressed.words
      : aiUIWords(event.formName || event.type);
  void engine.host.send({
    format: 'openui',
    label,
    messageId,
    name: event.type,
    payload: {
      ...(context === undefined ? {} : { context }),
      ...(message && message !== label ? { message } : {}),
      ...(Object.keys(params).length ? { params } : {}),
      ...(event.formName ? { form: event.formName } : {}),
      ...(Object.keys(values).length ? { values } : {}),
    },
  });
};

// How often a Query may ask one of the app's tools for the same thing: an agent's program can
// ask for a refresh every fraction of a second.
const QUERY_REFRESH_MS = 5_000;

type Asked = { at: number; output: Promise<unknown> };

/**
 * How long after the person presses a control in a reply's UI the tools it runs count as theirs:
 * as long as a browser's activation lasts, so a Mutation the press runs after another still can.
 */
export const TOOL_PRESS_MS = 5_000;

/**
 * The host's tools as a program's Query() and Mutation() run them: one that changes something
 * runs only while `isActing`, just after the person pressed a control in this reply's UI, and
 * the same question asked again within a few seconds, as a Query refreshing on its own does,
 * gets the answer it got. A press elsewhere on the page, such as sending a message, doesn't
 * count, as the browser's own activation would.
 */
export const hostToolProvider = (
  engine: OpenUIEngine,
  isActing: () => boolean = () => false,
) => {
  const asked = new Map<string, Asked>();
  return Object.fromEntries(
    engine.host.toolNames.map((name) => [
      name,
      (args: Record<string, unknown>) => {
        const userInitiated = isActing();
        if (userInitiated) return engine.host.runTool(name, args, { userInitiated });
        let key: string;
        try {
          key = `${name}\u0000${JSON.stringify(args)}`;
        } catch {
          return engine.host.runTool(name, args);
        }
        const last = asked.get(key);
        if (last && Date.now() - last.at < QUERY_REFRESH_MS) return last.output;
        const output = engine.host.runTool(name, args);
        asked.set(key, { at: Date.now(), output });
        return output;
      },
    ]),
  );
};

const errorOf = ({ code, component, message, statementId }: LangError): OpenUIError => ({
  code,
  message,
  ...(component ? { component } : {}),
  ...(statementId ? { statementId } : {}),
});

// Each error of a reply once, and only once the reply is written: while it streams, a program
// is unfinished, and what it lacks is still coming.
const reportOnce = (engine: OpenUIEngine, messageId: string, errors: LangError[]) => {
  let reported = engine.reported.get(messageId);
  if (!reported) engine.reported.set(messageId, (reported = new Set()));
  for (const error of errors) {
    if (error.severity === 'warning') continue;
    const key = [error.code, error.message, error.statementId].join('\u0000');
    if (reported.has(key)) continue;
    reported.add(key);
    engine.report(errorOf(error), messageId);
  }
};

// Whether a program, as OpenUI read it, draws nothing: no root, such as words that aren't
// OpenUI at all.
const drawsNothing = (parsed: ParseResult | null) =>
  !!parsed && !parsed.root && !parsed.rootExpression;

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
  const parsed = useRef<ParseResult | null>(null);
  const reply = useMemo(
    () => ({ engine, isStreaming, messageId }),
    [engine, isStreaming, messageId],
  );
  // What the person entered, kept by the host, so it survives scrolling and remounts.
  const [initialState] = useState(() => {
    const kept = engine.host.state(messageId);
    return isRecord(kept) ? kept : undefined;
  });
  // What the person last pressed, whose words their message says.
  const pressed = useRef<Pressed | undefined>(undefined);
  // The program's state as OpenUI last gave it, secrets and all, which never leaves this reply.
  const state = useRef<Record<string, unknown> | undefined>(initialState);
  // When the person last pressed a control in this reply's UI, which the tools it runs count as
  // theirs for a moment.
  const pressedAt = useRef(-Infinity);
  // The tools a program's Query() and Mutation() run: the renderer's, else the host's.
  const toolProvider = useMemo(
    () =>
      engine.options.toolProvider ??
      hostToolProvider(engine, () => Date.now() - pressedAt.current < TOOL_PRESS_MS),
    [engine],
  );
  // Once the reply is written: what is wrong with its program, and whether it draws anything,
  // as OpenUI last read it.
  useEffect(() => {
    if (isStreaming) return;
    reportOnce(engine, messageId, errors.current);
    if (drawsNothing(parsed.current)) engine.drewNothing(messageId, program);
  }, [engine, isStreaming, messageId, program]);
  const follow = aiUILinkOpener(engine.host);
  const secrets = () => secretsOf(parsed.current);
  return (
    <OpenUIReplyContext.Provider value={reply}>
      <div
        className='str-chat__openui'
        onAuxClickCapture={follow}
        onClickCapture={(event) => {
          if (isControl(event.target)) pressedAt.current = Date.now();
          pressed.current = pressedOf(event.target) ?? pressed.current;
          follow(event);
        }}
      >
        <Renderer
          initialState={initialState}
          isStreaming={isStreaming}
          library={library}
          onAction={(event) => {
            actOn(engine, messageId, event, {
              pressed: pressed.current,
              secrets: secrets(),
              state: state.current,
            });
            pressed.current = undefined;
          }}
          onError={(found) => {
            errors.current = found;
            if (!isStreaming) reportOnce(engine, messageId, found);
          }}
          onParseResult={(result) => {
            parsed.current = result;
            if (!isStreaming && drawsNothing(result))
              engine.drewNothing(messageId, program);
          }}
          onStateUpdate={(next) => {
            state.current = next;
            engine.host.setState(messageId, withoutSecrets(next, secrets()));
          }}
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
