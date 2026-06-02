import type { ComponentType } from 'react';
import { SingleDisplay } from './single/SingleDisplay';
import { MultipleDisplay } from './multiple/MultipleDisplay';
import { WindowDisplay } from './window/WindowDisplay';
import { WindowMobileDisplay } from './window-mobile/WindowMobileDisplay';
import { PixiConfirmDisplay } from './pixi-confirm/PixiConfirmDisplay';
import { ScreenSizeDisplay } from './screen-size/ScreenSizeDisplay';

export const EXAMPLES = [
  'screen-size',
  'window-mobile',
  'single',
  'multiple',
  'window',
  'pixi-confirm',
] as const;
export type Example = (typeof EXAMPLES)[number];
export const DEFAULT_EXAMPLE: Example = 'screen-size';

export const isExample = (s: string): s is Example =>
  (EXAMPLES as readonly string[]).includes(s);

export const exampleMap: Record<Example, ComponentType> = {
  'screen-size': ScreenSizeDisplay,
  'window-mobile': WindowMobileDisplay,
  single: SingleDisplay,
  multiple: MultipleDisplay,
  window: WindowDisplay,
  'pixi-confirm': PixiConfirmDisplay,
};
