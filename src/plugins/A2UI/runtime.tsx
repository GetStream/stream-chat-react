// The part of the A2UI renderer that runs the official A2UI packages. It loads in the browser
// when a reply first shows A2UI, because the packages define custom elements, which a server
// cannot, and are of no use to an app whose agent never writes A2UI.
import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import {
  A2uiSurface,
  createBinderlessComponentImplementation,
  createComponentImplementation,
} from '@a2ui/react';
import {
  type ActionPayload,
  Catalog,
  type ComponentApi,
  type ComponentContext,
  createFunctionImplementation,
  effect,
  getValue,
  MessageProcessor,
  peekValue,
  type SurfaceModel,
} from '@a2ui/web_core';
import {
  basicCatalog,
  createBasicCatalogFunctions,
  OpenUrlApi,
} from '@a2ui/web_core/catalogs/basic/v1';

import {
  type AIUIComponent,
  AIUIComponentView,
} from '../AIComponents/GenerativeUI/AIUIComponent';
import type { AIUIJSONSchema } from '../AIComponents/GenerativeUI/AIUIComponentDefinition';
import type { AIUIDocument } from '../AIComponents/GenerativeUI/AIUIDocument';
import { A2UIPlaceholder } from './A2UIPlaceholder';
import type { A2UIEngine, A2UIError } from './A2UIRenderer';
import { A2UIEngineContext, STREAM_BASIC_COMPONENTS } from './basicComponents';
import {
  A2UI_VERSION,
  a2uiMessagesIn,
  a2uiSourceOf,
  normalizeA2UIMessage,
} from './A2UIStream';

// A catalog entry, as web_core reads it. `@a2ui/react` types its entries against the Zod the app
// resolves, which can be another major than web_core's own; at runtime only web_core's runs.
type Entry = ComponentApi;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The A2UI type of one of the app's components, named as the basic catalog names its own. */
export const a2uiTypeName = (name: string) =>
  name
    .split(/[_\- ]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const sentence = (text: string) => {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

// A parameter as the agent may write it: the value its schema describes, bound to the data
// model, or worked out by a function.
const dynamic = (schema: AIUIJSONSchema) => ({
  anyOf: [
    schema,
    { $ref: 'common_types.json#/$defs/DataBinding' },
    { $ref: 'common_types.json#/$defs/FunctionCall' },
  ],
});

/**
 * The app's components as an A2UI catalog document: each under its A2UI type, its parameters
 * as its properties and what its events do in its description, since it reports them itself
 * rather than through an A2UI action the agent writes. The same as StreamChatA2UI's
 * `PortableComponent`, so an agent writes for both alike.
 */
export const a2uiAppCatalogDocument = (
  catalogId: string,
  components: AIUIComponent[],
) => ({
  catalogId,
  components: Object.fromEntries(
    components.map(({ definition }) => {
      const type = a2uiTypeName(definition.name);
      const notes = [
        definition.description,
        ...definition.events.map((e) => e.description),
      ]
        .filter((note) => note.trim() !== '')
        .map(sentence);
      return [
        type,
        {
          ...(notes.length ? { description: notes.join(' ') } : {}),
          properties: {
            component: { const: type },
            ...Object.fromEntries(
              definition.parameters.map(({ description, name, type: schema }) => [
                name,
                dynamic(description === undefined ? schema : { ...schema, description }),
              ]),
            ),
          },
          required: [
            'component',
            ...definition.parameters
              .filter(({ isRequired }) => isRequired)
              .map(({ name }) => name),
          ],
          type: 'object',
        },
      ];
    }),
  ),
  protocolVersion: A2UI_VERSION,
});

type A2UIReplyContextValue = { isStreaming: boolean; messageId: string };

const A2UIReplyContext = createContext<A2UIReplyContextValue | undefined>(undefined);

// The declared parameters of an app's component as the agent wrote them, bindings and functions
// worked out, following the data model and the component's updates.
const useResolvedArguments = (context: ComponentContext, names: string[]) => {
  const namesKey = names.join('\u0000');
  const store = useMemo(() => {
    const declared = namesKey.split('\u0000');
    const signalOf = () => {
      const { properties } = context.componentModel;
      const written = Object.fromEntries(
        declared
          .filter((name) => name in properties)
          .map((name) => [name, properties[name]]),
      );
      return context.dataContext.resolveSignal<Record<string, unknown>>(written);
    };
    let value: Record<string, unknown> = {};
    try {
      value = peekValue(signalOf()) ?? {};
    } catch {
      value = {};
    }
    return {
      get: () => value,
      subscribe: (onChange: () => void) => {
        let stop = () => undefined as void;
        const watch = () => {
          stop();
          try {
            const signal = signalOf();
            stop = effect(() => {
              value = getValue(signal) ?? {};
              onChange();
            });
          } catch {
            value = {};
            onChange();
          }
        };
        watch();
        const updates = context.componentModel.onUpdated.subscribe(watch);
        return () => {
          stop();
          updates.unsubscribe();
        };
      },
    };
  }, [context, namesKey]);
  return useSyncExternalStore(store.subscribe, store.get);
};

// One of the app's components where the agent placed it in a reply's surface.
const PlacedComponent = ({
  component,
  context,
  engine,
}: {
  component: AIUIComponent;
  context: ComponentContext;
  engine: A2UIEngine;
}) => {
  const reply = useContext(A2UIReplyContext);
  const args = useResolvedArguments(
    context,
    component.definition.parameters.map(({ name }) => name),
  );
  if (!reply) return null;
  const { messageId } = reply;
  const { name } = component.definition;
  return (
    <AIUIComponentView
      args={args}
      component={component}
      context={{
        emit: (event, label, payload = {}) =>
          void engine.host.send({
            format: 'a2ui',
            label,
            messageId,
            name: event,
            payload: { ...payload, component: name },
          }),
        host: engine.host,
        isStreaming: reply.isStreaming,
        messageId,
      }}
    />
  );
};

const catalogsByEngine = new WeakMap<A2UIEngine, Catalog<Entry>[]>();

/**
 * The catalogs a reply's surfaces are made with: the basic catalog with the app's components,
 * under the renderer's catalog id and under the basic catalog's own, so a surface naming either
 * shows them. Links open the way the host allows.
 */
export const catalogsOf = (engine: A2UIEngine) => {
  const made = catalogsByEngine.get(engine);
  if (made) return made;
  const functions = [
    ...createBasicCatalogFunctions().filter(({ name }) => name !== OpenUrlApi.name),
    createFunctionImplementation(OpenUrlApi, ({ url }) => {
      engine.host.open(String(url));
    }),
  ];
  const appComponents: Entry[] = [];
  for (const component of engine.host.components) {
    const type = a2uiTypeName(component.definition.name);
    try {
      const api = Catalog.fromJson(
        a2uiAppCatalogDocument(engine.catalogId, [component]),
        A2UI_VERSION,
      ).components.get(type);
      if (!api) continue;
      const implementation = createBinderlessComponentImplementation(
        api as never,
        ({ context }) => (
          <PlacedComponent component={component} context={context} engine={engine} />
        ),
      );
      appComponents.push(implementation as unknown as Entry);
    } catch (error) {
      engine.report(
        {
          code: 'CATALOG_ERROR',
          message: `The component ${component.definition.name} can't join the catalog: ${String(error)}`,
        },
        '',
      );
    }
  }
  // The basic catalog's components, Stream's where Stream draws them.
  const components: Entry[] = [
    ...[...basicCatalog.components.values()].map((entry) => {
      const streamComponent = STREAM_BASIC_COMPONENTS[entry.name];
      return streamComponent
        ? (createComponentImplementation(
            entry as never,
            streamComponent as never,
          ) as unknown as Entry)
        : entry;
    }),
    ...appComponents,
  ];
  const catalogs = [
    new Catalog<Entry>(engine.catalogId, A2UI_VERSION, components, functions),
    ...(engine.catalogId === basicCatalog.id
      ? []
      : [new Catalog<Entry>(basicCatalog.id, A2UI_VERSION, components, functions)]),
  ];
  catalogsByEngine.set(engine, catalogs);
  return catalogs;
};

type RendererError = {
  code?: unknown;
  message?: unknown;
  path?: unknown;
  surfaceId?: unknown;
};

const errorOf = (error: RendererError): A2UIError => ({
  code: typeof error.code === 'string' ? error.code : 'EXECUTION_ERROR',
  message: typeof error.message === 'string' ? error.message : String(error.message),
  ...(typeof error.path === 'string' ? { path: error.path } : {}),
  ...(typeof error.surfaceId === 'string' ? { surfaceId: error.surfaceId } : {}),
});

/**
 * The surfaces of one reply: its own processor, fed the messages of its document as they
 * complete. Messages that changed, rather than grew, start its surfaces again.
 */
export class A2UIReplyState {
  isStreaming = false;

  private applied: string[] = [];
  private readonly engine: A2UIEngine;
  private listeners = new Set<() => void>();
  private readonly messageId: string;
  private processor: MessageProcessor<Entry>;
  private reported = new Set<string>();
  private shown: SurfaceModel<Entry>[] = [];
  private stopWatching: () => void;

  constructor(engine: A2UIEngine, messageId: string) {
    this.engine = engine;
    this.messageId = messageId;
    this.processor = this.makeProcessor();
    this.stopWatching = this.watch();
  }

  /** The reply's surfaces, in the order the agent made them. */
  surfaces = () => this.shown;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Applies the messages of `source` not applied yet. */
  update(source: string, isStreaming: boolean) {
    this.isStreaming = isStreaming;
    const messages = a2uiMessagesIn(source);
    const grew =
      messages.length >= this.applied.length &&
      this.applied.every((message, index) => messages[index] === message);
    if (!grew) {
      this.stopWatching();
      this.processor.dispose();
      this.processor = this.makeProcessor();
      this.stopWatching = this.watch();
      this.applied = [];
    }
    for (const raw of messages.slice(this.applied.length)) {
      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        json = undefined;
      }
      if (!isRecord(json)) {
        this.report({
          code: 'VALIDATION_FAILED',
          message: 'A message isn’t a JSON object',
        });
        continue;
      }
      this.feed(normalizeA2UIMessage(json, this.engine.catalogId));
    }
    this.applied = messages;
    this.refresh();
  }

  dispose() {
    this.stopWatching();
    this.processor.dispose();
    this.listeners.clear();
  }

  // Feeds a message to the processor. A batch of components that one bad component spoils is
  // fed again a component at a time, so the rest show, as they would while being written.
  private feed(message: Record<string, unknown>) {
    let errors = this.processor.processMessagesWithErrors(message);
    const { updateComponents } = message;
    if (
      errors.length &&
      isRecord(updateComponents) &&
      Array.isArray(updateComponents.components) &&
      updateComponents.components.length > 1
    ) {
      errors = updateComponents.components.flatMap((component) =>
        this.processor.processMessagesWithErrors({
          ...message,
          updateComponents: { ...updateComponents, components: [component] },
        }),
      );
    }
    for (const { error } of errors) this.report(errorOf(error));
  }

  private makeProcessor() {
    return new MessageProcessor<Entry>(catalogsOf(this.engine), (action) =>
      this.act(action),
    );
  }

  // Tells the agent what the person did, in their words: the action's own, else what its
  // button says, else its name.
  private act(action: ActionPayload) {
    void this.engine.host.send({
      format: 'a2ui',
      label: action.userMessage ?? this.buttonText(action) ?? action.name,
      messageId: this.messageId,
      name: action.name,
      payload: {
        context: action.context,
        sourceComponentId: action.sourceComponentId,
        surfaceId: action.surfaceId,
      },
    });
  }

  private buttonText(action: ActionPayload) {
    const components = this.processor.model.getSurface(action.surfaceId)?.componentsModel;
    const child: unknown = components?.get(action.sourceComponentId)?.properties.child;
    if (typeof child !== 'string') return undefined;
    const text: unknown = components?.get(child)?.properties.text;
    return typeof text === 'string' && text !== '' ? text : undefined;
  }

  private watch() {
    const subscriptions = [
      this.processor.onSurfaceCreated(() => this.refresh()),
      this.processor.onSurfaceDeleted(() => this.refresh()),
      this.processor.model.onError.subscribe((error) => this.report(errorOf(error))),
    ];
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private refresh() {
    const surfaces = [...this.processor.getSurfaces().values()];
    if (
      surfaces.length === this.shown.length &&
      surfaces.every((surface, index) => surface === this.shown[index])
    ) {
      return;
    }
    this.shown = surfaces;
    this.listeners.forEach((listener) => listener());
  }

  // Each error once: a reply's messages are fed again as it streams, and the processor tells
  // the same error both as it fails a message, with the place in it, and to the surface.
  private report(error: A2UIError) {
    const key = [error.code, error.message, error.surfaceId].join('\u0000');
    if (this.reported.has(key)) return;
    this.reported.add(key);
    this.engine.report(error, this.messageId);
  }
}

/** The surfaces of a reply, made with its messages so far the first time they are asked for. */
export const replyOf = (
  engine: A2UIEngine,
  document: AIUIDocument,
  messageId: string,
) => {
  let reply = engine.replies.get(messageId);
  if (!reply) {
    reply = new A2UIReplyState(engine, messageId);
    engine.replies.set(messageId, reply);
    reply.update(a2uiSourceOf(document) ?? '', document.isStreaming);
  }
  return reply;
};

/** Whether a finished reply's A2UI made no surface, so its text shows instead. */
export const showsNothing = (
  engine: A2UIEngine,
  document: AIUIDocument,
  messageId: string,
) =>
  !document.isStreaming && replyOf(engine, document, messageId).surfaces().length === 0;

// The layout effect warns under server rendering; this module only runs in the browser, but
// tests may render it either way.
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** A reply's surfaces, following its document as the agent writes it. */
export const A2UIReplyContent = ({
  document,
  engine,
  messageId,
}: {
  document: AIUIDocument;
  engine: A2UIEngine;
  messageId: string;
}) => {
  const reply = replyOf(engine, document, messageId);
  const source = a2uiSourceOf(document) ?? '';
  const { isStreaming } = document;
  useIsomorphicLayoutEffect(() => {
    reply.update(source, isStreaming);
  }, [isStreaming, reply, source]);
  const surfaces = useSyncExternalStore(reply.subscribe, reply.surfaces);
  const replyContext = useMemo(
    () => ({ isStreaming, messageId }),
    [isStreaming, messageId],
  );
  if (surfaces.length === 0) return isStreaming ? <A2UIPlaceholder /> : null;
  return (
    <A2UIEngineContext.Provider value={engine}>
      <A2UIReplyContext.Provider value={replyContext}>
        <div className='str-chat__a2ui'>
          {surfaces.map((surface) => (
            <div className='str-chat__a2ui__surface' key={surface.id}>
              <A2uiSurface surface={surface as never} />
            </div>
          ))}
        </div>
      </A2UIReplyContext.Provider>
    </A2UIEngineContext.Provider>
  );
};

/** What the renderer's entry reaches once the runtime loads. */
export type A2UIRuntime = {
  A2UIReplyContent: typeof A2UIReplyContent;
  showsNothing: typeof showsNothing;
};
