import { cl01 } from './cl-01.ts';
import { cl10 } from './cl-10.ts';
import { cl11 } from './cl-11.ts';
import { cl02, cl03, cl04, cl05, cl13 } from './cl-variants.ts';
import { cl06, cl07, cl08, cl09 } from './cl-live.ts';
import { ml01 } from './ml-01.ts';
import { ml08, ml08ScrolledUp } from './ml-08.ts';
import { ml15 } from './ml-15.ts';
import { cl12, cs01, cs02, ml17 } from './mem.ts';
import { sk01, sk0160m } from './sk.ts';
import { th01, th02, th02Mainlist, th03 } from './th.ts';
import { ml13, ml13Pinned } from './jump.ts';
import { cp01, cp01Control, cp02 } from './cp.ts';
import { of02, of02Messagelist } from './of.ts';
import { wb01, wb01Visible, wb02, wb03 } from './wb.ts';
import { ml02, ml03, ml04, ml05, ml06, ml07, ml16 } from './ml-history.ts';
import { ml09, ml10, ml11, ml12 } from './ml-live.ts';
import type { RunScenario } from './run.ts';

// Every measured scenario, by id. Each later roadmap step adds its files here.
export const RUN_SCENARIOS: Record<string, RunScenario> = {
  [cl01.id]: cl01,
  [cl02.id]: cl02,
  [cl03.id]: cl03,
  [cl04.id]: cl04,
  [cl05.id]: cl05,
  [cl06.id]: cl06,
  [cl07.id]: cl07,
  [cl08.id]: cl08,
  [cl09.id]: cl09,
  [cl10.id]: cl10,
  [cl11.id]: cl11,
  [cl12.id]: cl12,
  [cl13.id]: cl13,
  [ml01.id]: ml01,
  [ml02.id]: ml02,
  [ml03.id]: ml03,
  [ml04.id]: ml04,
  [ml05.id]: ml05,
  [ml06.id]: ml06,
  [ml07.id]: ml07,
  [ml08.id]: ml08,
  [ml08ScrolledUp.id]: ml08ScrolledUp,
  [ml09.id]: ml09,
  [ml10.id]: ml10,
  [ml11.id]: ml11,
  [ml12.id]: ml12,
  [ml13.id]: ml13,
  [ml13Pinned.id]: ml13Pinned,
  [ml15.id]: ml15,
  [ml16.id]: ml16,
  [ml17.id]: ml17,
  [cs01.id]: cs01,
  [cs02.id]: cs02,
  [cp01.id]: cp01,
  [cp01Control.id]: cp01Control,
  [cp02.id]: cp02,
  [of02.id]: of02,
  [of02Messagelist.id]: of02Messagelist,
  [wb01.id]: wb01,
  [wb01Visible.id]: wb01Visible,
  [wb02.id]: wb02,
  [wb03.id]: wb03,
  [sk01.id]: sk01,
  [sk0160m.id]: sk0160m,
  [th01.id]: th01,
  [th02.id]: th02,
  [th02Mainlist.id]: th02Mainlist,
  [th03.id]: th03,
};
