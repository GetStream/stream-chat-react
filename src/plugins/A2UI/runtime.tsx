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
  setValue,
  signal,
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
import type { AIUIDocument } from '../AIComponents/GenerativeUI/AIUIDocument';
import {
  aiUIWords,
  isRecord,
  withoutSecretValues,
} from '../AIComponents/GenerativeUI/AIUIHelpers';
import { A2UIPlaceholder } from './A2UIPlaceholder';
import type { A2UIEngine, A2UIError } from './A2UIRenderer';
import { A2UIEngineContext, STREAM_BASIC_COMPONENTS } from './basicComponents';
import { a2uiAppCatalogDocument, a2uiTypeName } from './catalogDocument';
import {
  A2UI_VERSION,
  a2uiMessagesIn,
  a2uiSourceOf,
  normalizeA2UIMessage,
} from './A2UIStream';

// A catalog entry, as web_core reads it. `@a2ui/react` types its entries against the Zod the app
// resolves, which can be another major than web_core's own; at runtime only web_core's runs.
type Entry = ComponentApi;

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
  const basicFunctions = [
    ...createBasicCatalogFunctions().filter(({ name }) => name !== OpenUrlApi.name),
    createFunctionImplementation(OpenUrlApi, ({ url }) => {
      engine.host.open(String(url));
    }),
  ];
  // The app's tools, called as functions the catalog doesn't define, as StreamChatA2UI calls
  // them: one that changes something runs only from what the person did, such as a tap.
  const anyArguments = OpenUrlApi.schema.pick({}).passthrough();
  const toolFunctions = engine.host.toolNames.flatMap((name) => {
    if (basicFunctions.some((basic) => basic.name === name)) {
      engine.report({
        code: 'CATALOG_ERROR',
        message: `The tool ${name} is left out of A2UI: the catalog has a function of that name`,
      });
      return [];
    }
    return [
      createFunctionImplementation(
        { name, returnType: 'any', schema: anyArguments },
        (args, context) => {
          const output = signal<unknown>(undefined);
          engine.host
            .runTool(name, withoutSecretValues(args, secretValuesOf(context.surface)), {
              userInitiated: context.isUserActivated,
            })
            .then(
              (value) => setValue(output, value),
              (error: unknown) =>
                engine.report({
                  code: 'EXECUTION_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                }),
            );
          return output;
        },
      ),
    ];
  });
  const functions = [...basicFunctions, ...toolFunctions];
  const basicNames = new Set(basicCatalog.components.keys());
  const appComponents: Entry[] = [];
  for (const component of engine.host.components) {
    const type = a2uiTypeName(component.definition.name);
    // One named like a basic component would replace it, so it is left out, as on iOS.
    if (basicNames.has(type) && engine.basicComponents[type as never] !== null) {
      engine.report({
        code: 'CATALOG_ERROR',
        message: `The component ${component.definition.name} is left out of A2UI: it would replace the catalog's ${type}`,
      });
      continue;
    }
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
      engine.report({
        code: 'CATALOG_ERROR',
        message: `The component ${component.definition.name} can't join the catalog: ${String(error)}`,
      });
    }
  }
  // The basic catalog's components: the app's where it draws one its own way, none where it
  // leaves one out, else Stream's where Stream draws them, else A2UI's own.
  const components: Entry[] = [
    ...[...basicCatalog.components.values()].flatMap((entry) => {
      const own = engine.basicComponents[entry.name as never] as unknown;
      if (own === null) return [];
      const view = own ?? STREAM_BASIC_COMPONENTS[entry.name];
      return view
        ? [
            createComponentImplementation(
              entry as never,
              view as never,
            ) as unknown as Entry,
          ]
        : [entry];
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

// The data model paths an obscured TextField writes, such as a password's.
const secretPathsOf = (surface: SurfaceModel<Entry> | undefined) => {
  const paths: string[] = [];
  for (const component of surface?.componentsModel.values ?? []) {
    const { value, variant } = component.properties;
    if (component.type !== 'TextField' || variant !== 'obscured' || !isRecord(value))
      continue;
    const path = value['@path'];
    if (typeof path === 'string') paths.push(path.startsWith('/') ? path : `/${path}`);
  }
  return paths;
};

// What the person typed in a surface's obscured fields, so none of it leaves the device.
const secretValuesOf = (surface: SurfaceModel<Entry> | undefined): string[] =>
  secretPathsOf(surface).flatMap((path) => {
    const value: unknown = surface?.dataModel.get(path);
    return typeof value === 'string' && value !== '' ? [value] : [];
  });

// A copy of a surface's data model without what its obscured fields hold.
const dataModelWithoutSecrets = (surface: SurfaceModel<Entry>) => {
  const copy = JSON.parse(JSON.stringify(surface.dataModel.get('/') ?? {})) as unknown;
  for (const path of secretPathsOf(surface)) {
    const keys = path.split('/').filter(Boolean);
    const last = keys.pop();
    let parent: unknown = copy;
    for (const key of keys) parent = isRecord(parent) ? parent[key] : undefined;
    if (isRecord(parent) && last !== undefined) delete parent[last];
  }
  return withoutSecretValues(copy, secretValuesOf(surface));
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
  private showedNothing = false;
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
    // A finished reply that made no surface shows its text, which the host shows when asked
    // again: it asked before these messages were applied.
    const showsNothing = !isStreaming && this.shown.length === 0;
    if (showsNothing !== this.showedNothing) {
      this.showedNothing = showsNothing;
      this.engine.host.refresh();
    }
  }

  dispose() {
    this.stopWatching();
    this.processor.dispose();
    this.listeners.clear();
  }

  // Feeds a message to the processor. A batch of components that one bad component spoils is
  // fed again a component at a time, so the rest show, as they would while being written.
  private feed(message: Record<string, unknown>) {
    const errors = this.processor.processMessagesWithErrors(message);
    const reported = errors.length ? (this.oneAtATime(message) ?? errors) : errors;
    for (const { error } of reported) this.report(errorOf(error));
  }

  // The components of a message one at a time, with what goes wrong with each, or `undefined`
  // when the message has no batch of them to feed again. A surface made with components is made
  // before they are added, and stays when they fail, so they are added to it.
  private oneAtATime(message: Record<string, unknown>) {
    const { createSurface, updateComponents } = message;
    const batch = isRecord(updateComponents)
      ? updateComponents
      : isRecord(createSurface)
        ? createSurface
        : undefined;
    if (!batch || !Array.isArray(batch.components) || batch.components.length < 2) {
      return undefined;
    }
    const { surfaceId } = batch;
    if (
      batch === createSurface &&
      (typeof surfaceId !== 'string' || !this.processor.model.getSurface(surfaceId))
    ) {
      return undefined;
    }
    return batch.components.flatMap((component: unknown) =>
      this.processor.processMessagesWithErrors({
        updateComponents: { components: [component], surfaceId },
        version: message.version,
      }),
    );
  }

  private makeProcessor() {
    return new MessageProcessor<Entry>(catalogsOf(this.engine), (action) =>
      this.act(action),
    );
  }

  // Tells the agent what the person did, as StreamChatA2UI does: their message says what the
  // button they tapped says, else the event's name as words, and what the agent wrote for it,
  // its `userMessage`, goes with it. So does the surface's data model when the agent asked for
  // it, and never what the person typed in an obscured field.
  private act(action: ActionPayload) {
    const surface = this.processor.model.getSurface(action.surfaceId);
    const secrets = secretValuesOf(surface);
    const context = withoutSecretValues(action.context ?? {}, secrets);
    for (const key of this.secretContextKeys(surface, action)) delete context[key];
    const userMessage = withoutSecretValues(action.userMessage ?? '', secrets).trim();
    void this.engine.host.send({
      format: 'a2ui',
      label: this.buttonText(surface, action) ?? aiUIWords(action.name),
      messageId: this.messageId,
      name: action.name,
      payload: {
        context,
        ...(surface?.sendDataModel
          ? { dataModel: dataModelWithoutSecrets(surface) }
          : {}),
        sourceComponentId: action.sourceComponentId,
        surfaceId: action.surfaceId,
        ...(userMessage ? { userMessage } : {}),
      },
    });
  }

  // The keys of an event's context the agent bound to an obscured field.
  private secretContextKeys(
    surface: SurfaceModel<Entry> | undefined,
    action: ActionPayload,
  ) {
    const secretPaths = secretPathsOf(surface);
    const event: unknown = surface?.componentsModel.get(action.sourceComponentId)
      ?.properties.action;
    const written =
      isRecord(event) && isRecord(event.event) ? event.event.context : undefined;
    if (!isRecord(written)) return [];
    return Object.entries(written).flatMap(([key, value]) => {
      const path = isRecord(value) ? value['@path'] : undefined;
      if (typeof path !== 'string') return [];
      const absolute = path.startsWith('/') ? path : `/${path}`;
      return secretPaths.some(
        (secret) => absolute === secret || absolute.startsWith(`${secret}/`),
      )
        ? [key]
        : [];
    });
  }

  // What the button the person tapped says: its Text child, written or bound to the data model.
  private buttonText(surface: SurfaceModel<Entry> | undefined, action: ActionPayload) {
    const components = surface?.componentsModel;
    const child: unknown = components?.get(action.sourceComponentId)?.properties.child;
    if (typeof child !== 'string') return undefined;
    const text: unknown = components?.get(child)?.properties.text;
    const shown =
      isRecord(text) && typeof text['@path'] === 'string' && text['@path'].startsWith('/')
        ? (surface?.dataModel.get(text['@path']) as unknown)
        : text;
    return typeof shown === 'string' && shown.trim() !== '' ? shown.trim() : undefined;
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
