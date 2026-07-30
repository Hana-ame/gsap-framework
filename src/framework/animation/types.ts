export interface TweenHandle {
  kill(): void;
}

export interface TimelineHandle {
  to(target: any, vars: Record<string, any>): TimelineHandle;
  kill(): void;
}

export interface AnimationDriver {
  to(target: any, vars: Record<string, any>): TweenHandle;
  killTweensOf(target: any, props?: string): void;
  timeline(vars?: Record<string, any>): TimelineHandle;
  delayedCall(duration: number, callback: () => void): TweenHandle;
}

let _defaultDriver: AnimationDriver | null = null;

export function setDefaultDriver(driver: AnimationDriver): void {
  _defaultDriver = driver;
}

import { GSAPDriver } from './GSAPDriver';

export function getDefaultDriver(): AnimationDriver {
  if (!_defaultDriver) {
    _defaultDriver = new GSAPDriver();
  }
  return _defaultDriver;
}
