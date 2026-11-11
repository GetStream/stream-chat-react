import { nanoid } from 'nanoid';

const STORAGE_KEY = 'io.getstream.ai.client-id';

// Used when the browser keeps nothing (storage blocked, private mode, server rendering), so
// the id still holds for as long as the page lives.
let inMemoryId: string | undefined;

const createId = () =>
  'web-' +
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : nanoid());

const readStored = () => {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

const store = (id: string) => {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, id);
  } catch {
    // Kept in memory only.
  }
};

/**
 * A stable identifier for this install (this browser profile), for addressing client tool
 * calls to it. Put it in the custom data of the person's message (`client_id`) so the agent
 * can copy it onto the calls it makes while answering, and pass it to `AIToolApprover` as
 * `clientId`.
 */
export const AIClientIdentity = {
  /**
   * This install's identifier, created on first use and kept in `localStorage`. Where storage
   * is unavailable it lives in memory, for as long as the page does.
   */
  installId(): string {
    const saved = readStored() ?? inMemoryId;
    if (saved) return saved;
    const created = createId();
    inMemoryId = created;
    store(created);
    return created;
  },
};
