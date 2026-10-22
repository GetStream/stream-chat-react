# perf

Web performance harness for `stream-chat-react`. Private workspaces, never published (the SDK
publishes `dist/` only).

The plan and protocol live in `stream-chat-perf-cli` (`WEB-PLAN.md`, `WEB-SCENARIOS.md`). The
backend state comes from that repo's `chatperf` CLI.

| Package                        | Path      | What it is                                                                      |
| ------------------------------ | --------- | ------------------------------------------------------------------------------- |
| `@stream-io/react-perf-host`   | `host/`   | A minimal chat page using the SDK under test, configured entirely by URL params |
| `@stream-io/react-perf-runner` | `runner/` | Seeds through `chatperf`, drives the host in Chromium, and writes result rows   |

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

## Runner

Needs `chatperf` (its checkout next to this repo, or `CHATPERF_DIR`), with `STREAM_KEY` /
`STREAM_SECRET` in the environment. Node runs the TypeScript directly; there is no build step.

```bash
P='yarn workspace @stream-io/react-perf-runner perf'
$P run cl-10 [--build dev|prod] [--column chrome-desktop|chrome-4x] [-n 5]
$P run ml-08 --type messaging|livestream [--list standard|virtualized] [--no-seed] [--no-verify]
$P renders ml-09 --record|--replay [--build profiling|dev]
$P check ml-08-oldest [--seed]
```

- `run` seeds the scenario's dataset (unless `--no-seed`), verifies it, starts the host, runs N
  iterations (the first is dropped), and appends one row per grid cell to `results/rows.csv`, with
  every iteration in `results/run-*.json`. Iterations that fail a gate are discarded with their
  reasons; if none is left, the evidence is kept in `results/run-*-discarded.json`.
- Live scenarios (ML-08 … ML-12, CL-06 … CL-09) mutate their dataset. A batch is one seed and one
  verify: run later scenarios on the same seed with `--no-seed --no-verify`, and ML-10 last (its
  deletes leave the newest page as placeholders).
- Scenarios: `cl-01 cl-06 cl-07 cl-08 cl-09 cl-10 cl-11 ml-01 ml-08 ml-08-scrolled-up ml-09 ml-10
ml-11 ml-12 ml-15`.
- Runs are headed (Chromium windows open) unless `--headless`; frame numbers depend on the
  display's refresh rate.
