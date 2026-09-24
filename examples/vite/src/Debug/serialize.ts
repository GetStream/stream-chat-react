/**
 * JSON replacer for composer state.
 *
 * Composer state holds things `JSON.stringify` renders uselessly or chokes on: `File`/`Blob`
 * handles on `localMetadata`, functions in the config (`doUploadRequest`, `fileUploadFilter`),
 * and object graphs that reference each other.
 *
 * Note the `seen` set is shared across the whole document, so a value referenced twice in
 * different branches is reported as `[circular]` even though it is merely repeated. That is a
 * deliberate simplification — it guarantees termination, and for debug output "this is the same
 * object you already saw" is usually the more useful reading anyway.
 */
const createReplacer = () => {
  const seen = new WeakSet<object>();

  return (_key: string, value: unknown) => {
    if (value instanceof File) {
      return `File(${value.name}, ${value.size} B, ${value.type || 'no mime type'})`;
    }
    if (value instanceof Blob) return `Blob(${value.size} B, ${value.type})`;
    if (typeof value === 'function') {
      return `ƒ ${(value as { name?: string }).name || 'anonymous'}()`;
    }
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Map) return Object.fromEntries(value.entries());
    if (value instanceof Set) return [...value];
    if (value && typeof value === 'object') {
      if (seen.has(value)) return '[circular]';
      seen.add(value);
    }
    return value;
  };
};

export const toDebugJson = (value: unknown) => {
  try {
    return JSON.stringify(value, createReplacer(), 2) ?? String(value);
  } catch (error) {
    return `<could not serialize: ${error instanceof Error ? error.message : 'unknown'}>`;
  }
};
