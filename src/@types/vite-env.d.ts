/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly E2E_APP_KEY: string;
  readonly E2E_APP_SECRET: string;
  readonly E2E_TEST_USER_1: string;
  readonly E2E_TEST_USER_1_TOKEN: string;
  readonly E2E_TEST_USER_2: string;
  readonly E2E_TEST_USER_2_TOKEN: string;
  readonly E2E_JUMP_TO_MESSAGE_CHANNEL: string;
  readonly E2E_ADD_MESSAGE_CHANNEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
