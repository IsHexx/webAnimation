export function scrollProgressToVideoTime(progress: number, duration: number): number {
  if (!Number.isFinite(progress) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  const clampedProgress = Math.min(1, Math.max(0, progress));
  return clampedProgress * duration;
}

export function scrollProgressToFrameIndex(progress: number, totalFrames: number): number {
  if (!Number.isFinite(progress) || !Number.isFinite(totalFrames) || totalFrames <= 1) {
    return 0;
  }

  const clampedProgress = Math.min(1, Math.max(0, progress));
  return Math.round(clampedProgress * (Math.floor(totalFrames) - 1));
}

type DampVideoTimeOptions = {
  currentTime: number;
  targetTime: number;
  deltaSeconds: number;
  smoothing: number;
};

export function dampVideoTime({
  currentTime,
  targetTime,
  deltaSeconds,
  smoothing,
}: DampVideoTimeOptions): number {
  if (![currentTime, targetTime, deltaSeconds, smoothing].every(Number.isFinite) || smoothing <= 0) {
    return currentTime;
  }

  const distance = targetTime - currentTime;
  if (Math.abs(distance) < 0.016) {
    return targetTime;
  }

  const blend = 1 - Math.exp(-smoothing * Math.max(0, deltaSeconds));
  return currentTime + distance * blend;
}
