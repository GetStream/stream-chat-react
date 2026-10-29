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
perf() { yarn workspace @stream-io/react-perf-runner perf "$@"; }
perf run cl-10 [--build dev|prod] [--column chrome-desktop|chrome-4x] [-n 5]
perf run ml-08 --type messaging|livestream [--list standard|virtualized] [--no-seed] [--no-verify]
perf run --set nightly|signoff|channel-list|message-list|leaks|desktop
perf renders ml-09 --record|--replay [--build profiling|dev] [--offline] [--baseline write|check]
perf check ml-08-oldest [--seed]
perf contract [--update]     # scenario files vs the pinned chatperf registry
perf compare                 # last 12 h of rows vs their 7-day median (the nightly check)
perf report                  # results/report-<date>.md from rows.csv
yarn workspace @stream-io/react-perf-runner test   # contract + compare unit tests
```

- `run` seeds the scenario's dataset (unless `--no-seed`), verifies it, starts the host, runs N
  iterations (the first is dropped), and appends one row per grid cell to `results/rows.csv`, with
  every iteration in `results/run-*.json`. Iterations that fail a gate are discarded with their
  reasons; if none is left, the evidence is kept in `results/run-*-discarded.json`. Memory
  scenarios also write `results/mem-*-chart.html`.
- Live scenarios (ML-08 … ML-12, CL-06 … CL-09, TH-02, CP-01, SK-01, WB-01) mutate their dataset. A
  batch is one seed and one verify: run later scenarios on the same seed with
  `--no-seed --no-verify`, and ML-10 last (its deletes leave the newest page as placeholders).
  Their `chatperf live` commands are data, in `src/scenarios/live-specs.ts`.
- `renders --offline` replays a fixture against the backend recorded with it (`src/world.ts`): no
  Stream app, no credentials, no Ruby. It is what the PR job (`.github/workflows/perf.yml`) runs;
  `--baseline check` fails when untargeted rows per commit exceed `fixtures/baseline.json`.
- Runs are headed (Chromium windows open) unless `--headless`; frame numbers depend on the
  display's refresh rate. WB-01 launches its own Chrome over raw CDP (Playwright keeps attached
  pages visible), so a second window opens for it.
- `PERF_RESULTS_DIR` moves results out of the checkout (the nightly machine keeps its history
  there).

Validation switches (deliberate failures, to prove a gate or metric works; every row says so):

| Variable                                               | Effect                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `PERF_HOST_PARAMS='leak=messages'` / `'leak=detached'` | a deliberate leak in the host (M-MEM must show it)                 |
| `PERF_HOST_PARAMS='drop_events=<types>'`               | the client never sees those events (e.g. `rows-changed` must fail) |
| `PERF_GATE_CHECK_OFFLINE=1`                            | ML-08 goes offline mid-window (`live-delivered` must fail)         |
| `PERF_GATE_CHECK_ONLINE=1`                             | OF-02 skips going offline (`went-offline` must fail)               |
| `PERF_GATE_CHECK_STALE=1`                              | no per-iteration re-seed (ML-12's `receipts-changed` must fail)    |
| `PERF_GATE_CHECK_KIND=<kind>`                          | ML-07 looks for that kind with a selector that can't match         |
| `PERF_AUTOMATION_CHECK=1`                              | CL-11 polls the page during the window (M-FRAMES must get worse)   |
