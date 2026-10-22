import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Starts the perf host for one build and stops it afterwards. The runner owns the server's
// lifetime, so a run never measures a host someone left running with other settings.

export type Build = 'dev' | 'prod' | 'profiling';

const hostDir = resolve(import.meta.dirname, '../../host');
const WORKSPACE = '@stream-io/react-perf-host';

const SERVE: Record<
  Build,
  { script: string; port: number; buildScript?: string; outDir?: string }
> = {
  dev: { port: 5173, script: 'dev' },
  profiling: {
    buildScript: 'build:profiling',
    outDir: 'dist-profiling',
    port: 4174,
    script: 'preview:profiling',
  },
  prod: { buildScript: 'build', outDir: 'dist', port: 4173, script: 'preview' },
};

// Its own process group, so stopping it also stops the vite server yarn starts underneath.
const yarn = (args: string[]) =>
  spawn('yarn', ['workspace', WORKSPACE, ...args], {
    cwd: hostDir,
    detached: true,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const run = (args: string[]) =>
  new Promise<void>((done, fail) => {
    const child = yarn(args);
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('exit', (code) =>
      code === 0 ? done() : fail(new Error(`yarn ${args.join(' ')} failed:\n${output}`)),
    );
  });

export const startHost = async (build: Build, { rebuild }: { rebuild: boolean }) => {
  const serve = SERVE[build];
  if (serve.buildScript && (rebuild || !existsSync(resolve(hostDir, serve.outDir!)))) {
    await run([serve.buildScript]);
  }

  const child = yarn([serve.script]);
  await new Promise<void>((ready, fail) => {
    let output = '';
    const onData = (d: Buffer) => {
      output += d;
      if (output.includes(`localhost:${serve.port}`)) ready();
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) =>
      fail(new Error(`host ${build} exited (${code}) before serving:\n${output}`)),
    );
  });

  return {
    origin: `http://localhost:${serve.port}`,
    stop: () => {
      try {
        process.kill(-child.pid!, 'SIGTERM');
      } catch {
        // already gone
      }
    },
  };
};
