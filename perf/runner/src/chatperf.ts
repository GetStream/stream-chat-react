import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

// chatperf (stream-chat-perf-cli) is used only as an external command: seed, verify, token, live.
//
//   CHATPERF_DIR  its checkout (default: ../stream-chat-perf-cli next to this repo)
//   CHATPERF_CMD  how to invoke it from there (default: `bundle exec bin/chatperf`)
//
// Its credentials (STREAM_KEY / STREAM_SECRET) and Ruby come from the environment it inherits.

const repoRoot = resolve(import.meta.dirname, '../../..');
const chatperfDir =
  process.env.CHATPERF_DIR ?? resolve(repoRoot, '../stream-chat-perf-cli');
const chatperfCmd = process.env.CHATPERF_CMD ?? 'bundle exec bin/chatperf';

const start = (args: string[]) =>
  spawn('sh', ['-c', `${chatperfCmd} "$@"`, 'chatperf', ...args], {
    cwd: chatperfDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

export type ChatperfResult = { code: number | null; output: string; stdout: string };

export const chatperf = (args: string[]) =>
  new Promise<ChatperfResult>((done, fail) => {
    const child = start(args);
    let stdout = '';
    let output = '';
    child.stdout.on('data', (d) => {
      stdout += d;
      output += d;
    });
    child.stderr.on('data', (d) => {
      output += d;
    });
    child.on('error', fail);
    child.on('exit', (code) => {
      if (code === 0) done({ code, output, stdout });
      else
        fail(new Error(`chatperf ${args.join(' ')} exited ${code}:\n${output.trim()}`));
    });
  });

/** A user token for qatest1: the last stdout line of `chatperf token qatest1`. */
export const userToken = async (user = 'qatest1') => {
  const { stdout } = await chatperf(['token', user]);
  const token = stdout.trim().split('\n').pop();
  if (!token?.startsWith('eyJ')) throw new Error('chatperf token printed no JWT');
  return token;
};

export type LiveFinished = {
  achieved_ratio: number | null;
  sent: number;
  failed: number;
  skipped: number;
  /** Seconds from the first event slot to the last. */
  elapsed: number;
  discard: boolean;
  by_type: Record<string, { sent: number; failed: number; skipped: number }>;
};

export type LiveRun = {
  /** Resolves when events start (`go`), with chatperf's wall-clock ms; null if the run ended first. */
  go: Promise<number | null>;
  /** Resolves when the run ends, with chatperf's verdict. */
  done: Promise<{
    code: number | null;
    output: string;
    /** `finished` from --events-json; null if chatperf died before reporting. */
    finished: LiveFinished | null;
    achievedPct: number | null;
    discard: boolean;
  }>;
};

type LiveEvent =
  | { event: 'go'; t: number }
  | ({ event: 'finished'; t: number } & LiveFinished);

/**
 * `chatperf live … --events-json`: chatperf prints `{"event":"go",…}` as events start and
 * `{"event":"finished",…}` with its verdict, on stderr (unbuffered), beside its human output.
 */
export const live = (args: string[]): LiveRun => {
  const child = start(['live', ...args, '--events-json']);
  let output = '';
  let finished: LiveFinished | null = null;
  let seenGo: (t: number | null) => void = () => {};
  const go = new Promise<number | null>((r) => {
    seenGo = r;
  });
  // One line buffer per stream, so a chunk of one can't split a line of the other.
  const reader = () => {
    let pending = '';
    return (d: Buffer) => {
      output += d;
      pending += d;
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('{"event"')) continue;
        const event = JSON.parse(line) as LiveEvent;
        if (event.event === 'go') seenGo(event.t);
        else finished = event;
      }
    };
  };
  child.stdout.on('data', reader());
  child.stderr.on('data', reader());
  const done = new Promise<Awaited<LiveRun['done']>>((resolveDone, fail) => {
    child.on('error', fail);
    child.on('exit', (code) => {
      const ratio = finished?.achieved_ratio;
      resolveDone({
        achievedPct: ratio == null ? null : Math.round(ratio * 100),
        code,
        discard: finished?.discard ?? true,
        finished,
        output,
      });
    });
  });
  // A run that dies before GO must not leave the caller waiting on it forever.
  void done.then(() => seenGo(null));
  return { done, go };
};
