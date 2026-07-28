let currentNow: () => Date = () => new Date();

/** The single injectable wall-clock seam used by scheduling and timestamps. */
export function now(): Date {
  return currentNow();
}

export function setNowForTests(value?: () => Date): void {
  currentNow = value ?? (() => new Date());
}
