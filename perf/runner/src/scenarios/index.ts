import { cl01 } from './cl-01.ts';
import { cl10 } from './cl-10.ts';
import { cl11 } from './cl-11.ts';
import { cl06, cl07, cl08, cl09 } from './cl-live.ts';
import { ml01 } from './ml-01.ts';
import { ml08, ml08ScrolledUp } from './ml-08.ts';
import { ml15 } from './ml-15.ts';
import { ml09, ml10, ml11, ml12 } from './ml-live.ts';
import type { RunScenario } from './run.ts';

// Every measured scenario, by id. Each later roadmap step adds its files here.
export const RUN_SCENARIOS: Record<string, RunScenario> = {
  [cl01.id]: cl01,
  [cl06.id]: cl06,
  [cl07.id]: cl07,
  [cl08.id]: cl08,
  [cl09.id]: cl09,
  [cl10.id]: cl10,
  [cl11.id]: cl11,
  [ml01.id]: ml01,
  [ml08.id]: ml08,
  [ml08ScrolledUp.id]: ml08ScrolledUp,
  [ml09.id]: ml09,
  [ml10.id]: ml10,
  [ml11.id]: ml11,
  [ml12.id]: ml12,
  [ml15.id]: ml15,
};
