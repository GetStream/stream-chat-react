import { overlapsFloatingSlot } from '../floatingDateSlot';

const rect = (top: number, bottom: number) =>
  ({ bottom, height: bottom - top, top }) as DOMRect;

// The list's top edge is at 100px, so the floating spot spans 100-120px for a 20px separator.
describe('overlapsFloatingSlot', () => {
  it('is false for a separator whose bottom edge is at the list top', () => {
    expect(overlapsFloatingSlot(rect(80, 100), 100)).toBe(false);
  });

  it('is true for a separator partly above the list top', () => {
    expect(overlapsFloatingSlot(rect(90, 110), 100)).toBe(true);
  });

  it('is true for a separator starting inside the floating spot', () => {
    expect(overlapsFloatingSlot(rect(119, 139), 100)).toBe(true);
  });

  it('is false for a separator starting where the floating spot ends', () => {
    expect(overlapsFloatingSlot(rect(120, 140), 100)).toBe(false);
  });
});
