/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The key of an app of your own; unset for the public demo app (see src/base/client.ts). */
  readonly VITE_STREAM_API_KEY?: string;
}
