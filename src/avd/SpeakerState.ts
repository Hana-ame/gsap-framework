import type { SpeakerStyle } from './types';

export class SpeakerState {
  expressionOverride: string | null = null;
  styles: Map<string, SpeakerStyle> = new Map();
}
