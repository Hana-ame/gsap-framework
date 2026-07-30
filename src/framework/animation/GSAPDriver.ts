import { gsap } from 'gsap';
import type { AnimationDriver, TweenHandle, TimelineHandle } from './types';

export class GSAPDriver implements AnimationDriver {
  static INSTANCE = new GSAPDriver();

  to(target: any, vars: Record<string, any>): TweenHandle {
    return gsap.to(target, vars);
  }

  killTweensOf(target: any, props?: string): void {
    gsap.killTweensOf(target, props);
  }

  timeline(vars?: Record<string, any>): TimelineHandle {
    const tl = gsap.timeline(vars);
    const handle: TimelineHandle = {
      to: (target: any, vars: Record<string, any>) => {
        tl.to(target, vars);
        return handle;
      },
      kill: () => tl.kill(),
    };
    return handle;
  }

  delayedCall(duration: number, callback: () => void): TweenHandle {
    return gsap.delayedCall(duration, callback);
  }
}
