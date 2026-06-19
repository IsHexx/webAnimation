import { describe, expect, it } from 'vitest';
import { dampVideoTime, scrollProgressToFrameIndex, scrollProgressToVideoTime } from './scrollVideo';

describe('scrollProgressToVideoTime', () => {
  it('maps scroll progress to the matching timestamp', () => {
    expect(scrollProgressToVideoTime(0.5, 8)).toBe(4);
  });

  it('clamps progress before mapping to video time', () => {
    expect(scrollProgressToVideoTime(-0.4, 8)).toBe(0);
    expect(scrollProgressToVideoTime(1.4, 8)).toBe(8);
  });

  it('returns zero for unavailable video duration', () => {
    expect(scrollProgressToVideoTime(0.5, Number.NaN)).toBe(0);
    expect(scrollProgressToVideoTime(0.5, 0)).toBe(0);
  });

  it('eases video time toward the target without overshooting', () => {
    const nextTime = dampVideoTime({
      currentTime: 2,
      targetTime: 6,
      deltaSeconds: 1 / 60,
      smoothing: 14,
    });

    expect(nextTime).toBeGreaterThan(2);
    expect(nextTime).toBeLessThan(6);
  });

  it('snaps tiny video time differences to avoid endless micro-seeking', () => {
    expect(
      dampVideoTime({
        currentTime: 4.001,
        targetTime: 4.002,
        deltaSeconds: 1 / 60,
        smoothing: 14,
      }),
    ).toBe(4.002);
  });

  it('maps scroll progress to a stable frame index', () => {
    expect(scrollProgressToFrameIndex(0, 241)).toBe(0);
    expect(scrollProgressToFrameIndex(0.5, 241)).toBe(120);
    expect(scrollProgressToFrameIndex(1, 241)).toBe(240);
  });

  it('clamps frame indexes at sequence bounds', () => {
    expect(scrollProgressToFrameIndex(-1, 241)).toBe(0);
    expect(scrollProgressToFrameIndex(2, 241)).toBe(240);
    expect(scrollProgressToFrameIndex(0.5, 0)).toBe(0);
  });
});
