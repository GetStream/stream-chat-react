/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_KEY: string;
  readonly VITE_APP_SECRET: string;
  readonly VITE_TEST_USER_1: string;
  readonly VITE_TEST_USER_1_TOKEN: string;
  readonly VITE_TEST_USER_2: string;
  readonly VITE_TEST_USER_2_TOKEN: string;
  readonly VITE_JUMP_TO_MESSAGE_CHANNEL: string;
  readonly VITE_ADD_MESSAGE_CHANNEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
