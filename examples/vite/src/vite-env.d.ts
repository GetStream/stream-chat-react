interface ImportMetaEnv {
  readonly VITE_STREAM_API_KEY?: string;
  readonly VITE_USER_ID?: string;
  readonly VITE_USER_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
