/**
 * One of the app's tools a reply's UI can run, such as to load data on this device, described
 * as the agent's model reads it. It is apart from the tools the agent itself calls. The
 * counterpart of `AIClientTool` in StreamChatAI.
 */
export type AIUIClientToolDefinition = {
  name: string;
  /** What it does, for the agent's model. */
  description?: string;
  /** The JSON Schema of its arguments, for the agent's model. */
  inputSchema?: Record<string, unknown>;
  /**
   * Whether it only reads, so the UI may run it whenever it asks, such as to show its output.
   * One that changes something runs only from something the person did, such as a tap.
   */
  readOnly?: boolean;
};

export type AIUIClientTool = AIUIClientToolDefinition & {
  /** Runs the tool. What it returns, as JSON, is the output the UI gets. */
  run: (args: Record<string, unknown>) => unknown;
};

/** Why one of the app's tools didn't give a reply's UI its output. */
export class AIUIToolError extends Error {
  readonly toolName: string;

  constructor(toolName: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AIUIToolError';
    this.toolName = toolName;
  }
}

/** A tool as the agent's backend reads it, in the shape of an MCP tool. */
export const aiUIClientToolJSON = ({
  description,
  inputSchema,
  name,
  readOnly,
}: AIUIClientToolDefinition) => ({
  annotations: { readOnlyHint: readOnly === true },
  ...(description ? { description } : {}),
  inputSchema: inputSchema ?? { type: 'object' },
  name,
});

/**
 * Whether the person is acting on the page right now, such as having just tapped, as the
 * browser tells it. A tool that changes something runs only then, rather than as a reply shows.
 */
export const isPersonActing = () => {
  if (typeof navigator === 'undefined') return false;
  const activation = (navigator as { userActivation?: { isActive?: boolean } })
    .userActivation;
  return activation?.isActive === true;
};

// Whether a tool's output can go to the UI as JSON, as it would from the agent.
export const isJSONValue = (value: unknown): boolean => {
  if (value === undefined) return true;
  try {
    return JSON.stringify(value) !== undefined;
  } catch {
    return false;
  }
};
