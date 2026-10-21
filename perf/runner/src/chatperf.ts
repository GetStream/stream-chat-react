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

export type LiveRun = {
  /** Resolves when the countdown prints GO and events start. */
  go: Promise<void>;
  /** Resolves when the run ends, with what chatperf reported. */
  done: Promise<{
    code: number | null;
    output: string;
    achievedPct: number | null;
    discard: boolean;
  }>;
};

/** `chatperf live …`, with the countdown's GO observed as it is printed: chatperf reports on stderr, which Ruby never buffers. */
export const live = (args: string[]): LiveRun => {
  const child = start(['live', ...args]);
  let output = '';
  let seenGo: () => void = () => {};
  const go = new Promise<void>((r) => {
    seenGo = r;
  });
  const onData = (d: Buffer) => {
    output += d;
    if (/^GO\s*$/m.test(output)) seenGo();
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  const done = new Promise<Awaited<LiveRun['done']>>((resolveDone, fail) => {
    child.on('error', fail);
    child.on('exit', (code) => {
      const achieved = output.match(/achieved (?:only )?(\d+)% of the requested rate/);
      resolveDone({
        achievedPct: achieved ? Number(achieved[1]) : null,
        code,
        discard: /DISCARD this measurement/.test(output),
        output,
      });
    });
  });
  // A run that dies before GO must not leave the caller waiting on it forever.
  void done.then(() => seenGo());
  return { done, go };
};
