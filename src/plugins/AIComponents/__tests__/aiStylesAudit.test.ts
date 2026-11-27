import {
  countStyleLiterals,
  findStyleLiterals,
  regressionsAgainst,
} from '../../../../scripts/ai-styles-audit.mjs';

const kinds = (source: string) => findStyleLiterals(source).map(({ kind }) => kind);

describe('the AI styles literal audit', () => {
  it('finds each kind of written-out value', () => {
    expect(
      kinds(`
.a {
  color: #353740;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.75rem 1rem;
  gap: 8px;
  top: -0.25rem;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 20%);
  transition: opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 1;
  width: 2rem;
  color: var(--str-chat__ai-text-primary);
  background: ai-token(bg-primary);
}`),
    ).toEqual([
      'colour',
      'colour',
      'spacing',
      'spacing',
      'spacing',
      'radius',
      'font',
      'font',
      'font',
      'colour',
      'shadow',
      'motion',
      'motion',
      'z-index',
      'size',
      'ai-token',
      'ai-token',
    ]);
  });

  it('accepts tokens, zero, hairlines and layout values', () => {
    expect(
      kinds(`
.a {
  padding: var(--str-chat__spacing-md);
  margin: 0;
  border: 1px solid var(--str-chat__border-core-default);
  border-radius: var(--str-chat__radius-max);
  font: var(--str-chat__font-body-default);
  font-weight: var(--str-chat__typography-font-weight-medium);
  width: 100%;
  flex: 1 1 0;
  inset: 0;
  transition: opacity var(--str-chat__menu-roll-duration);
  transition: visibility 0s linear $ai-duration-slow;
  --str-chat__ai-glow-size: 2rem;
}`),
    ).toEqual([]);
  });

  it('skips keyframes, registered properties, comments and allowed lines', () => {
    expect(
      kinds(`
@keyframes rise {
  from { transform: translateY(16px); padding: 1rem; }
  to { padding: 0; }
}
@property --x {
  syntax: '<length>';
  initial-value: 4px;
}
/* padding: 1rem; */
// margin: 2rem;
.a {
  max-width: 40rem; // ai-styles: allow reading measure
  padding: 1rem;
}`),
    ).toEqual(['spacing']);
  });

  it('counts the sizes handed to a mixin', () => {
    expect(
      kinds(
        '.a {\n  @include ai-icon(1.125rem);\n  @include ai-icon(var(--str-chat__icon-size-md));\n}',
      ),
    ).toEqual(['size']);
  });

  it('reads nested selectors as selectors, not declarations', () => {
    expect(
      kinds('.a {\n  &:hover {\n    color: var(--str-chat__text-primary);\n  }\n}'),
    ).toEqual([]);
  });

  it('holds counts to the baseline', () => {
    const current = {
      'a.scss': countStyleLiterals(
        findStyleLiterals('.a { padding: 1rem; margin: 2rem; }'),
      ),
    };
    expect(regressionsAgainst({ 'a.scss': { spacing: 2 } }, current)).toEqual([]);
    expect(regressionsAgainst({ 'a.scss': { spacing: 1 } }, current)).toEqual([
      { baseline: 1, count: 2, file: 'a.scss', kind: 'spacing' },
    ]);
    expect(regressionsAgainst({}, current)).toEqual([
      { baseline: 0, count: 2, file: 'a.scss', kind: 'spacing' },
    ]);
  });
});
