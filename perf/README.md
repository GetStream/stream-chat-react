# perf

Web performance harness for `stream-chat-react`. Private workspaces, never published (the SDK
publishes `dist/` only).

The plan and protocol live in `stream-chat-perf-cli` (`WEB-PLAN.md`, `WEB-SCENARIOS.md`). The
backend state comes from that repo's `chatperf` CLI.

| Package                      | Path    | What it is                                                                      |
| ---------------------------- | ------- | ------------------------------------------------------------------------------- |
| `@stream-io/react-perf-host` | `host/` | A minimal chat page using the SDK under test, configured entirely by URL params |

The names deliberately don't match `@stream-io/stream-chat-react-*`, which `yarn examples:build`
(and CI) builds.

## Host

```bash
yarn build                                          # the SDK, once (the host consumes dist/)
yarn workspace @stream-io/react-perf-host dev       # dev:  http://localhost:5173
yarn workspace @stream-io/react-perf-host build && yarn workspace @stream-io/react-perf-host preview
                                                    # prod: http://localhost:4173
yarn workspace @stream-io/react-perf-host build:profiling && yarn workspace @stream-io/react-perf-host preview:profiling
                                                    # profiling (render counts only): http://localhost:4174
```

Open it with `?api_key=…&token=…&user_id=qatest1&list=standard|virtualized&type=messaging|livestream`
(`chatperf token qatest1` prints the token). Optional: `cap=<n>|none` (exploration only; the
protocol's cap follows `type`) and `page_size=<n>` (default 30).
