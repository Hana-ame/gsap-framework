/** LayoutGroup — gown.js-inspired lazy-evaluated layout container.
 *  Uses invalidation pattern: `addChild` sets dirty flag, `onRender` redraws once per frame. */
import * as PIXI from 'pixi.js';

export type LayoutDirection = 'horizontal' | 'vertical';
export type LayoutAlignment = 'start' | 'center' | 'end' | 'stretch';

export interface LayoutDef {
  direction?: LayoutDirection;
  gap?: number;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  alignment?: LayoutAlignment;
  crossStretch?: boolean;
}

interface LayoutNode {
  container: PIXI.Container;
  width?: number;
  height?: number;
}

export class LayoutGroup {
  readonly stage: PIXI.Container;
  private _nodes: LayoutNode[] = [];
  private _def: Required<LayoutDef>;
  private _dirty = true;

  constructor(layout?: LayoutDef) {
    this._def = {
      direction: layout?.direction ?? 'vertical',
      gap: layout?.gap ?? 4,
      padding: layout?.padding ?? 0,
      paddingTop: layout?.paddingTop ?? layout?.padding ?? 0,
      paddingBottom: layout?.paddingBottom ?? layout?.padding ?? 0,
      paddingLeft: layout?.paddingLeft ?? layout?.padding ?? 0,
      paddingRight: layout?.paddingRight ?? layout?.padding ?? 0,
      alignment: layout?.alignment ?? 'start',
      crossStretch: layout?.crossStretch ?? false,
    };

    this.stage = new PIXI.Container();
    this.stage.onRender = () => { if (this._dirty) this._arrange(); };
  }

  addChild(container: PIXI.Container, width?: number, height?: number): void {
    this._nodes.push({ container, width, height });
    this.stage.addChild(container);
    this._dirty = true;
  }

  removeChild(container: PIXI.Container): void {
    const idx = this._nodes.findIndex((n) => n.container === container);
    if (idx < 0) return;
    this._nodes.splice(idx, 1);
    this.stage.removeChild(container);
    this._dirty = true;
  }

  removeAll(): void {
    this._nodes = [];
    this.stage.removeChildren();
    this._dirty = true;
  }

  setLayout(layout: LayoutDef): void {
    this._def = {
      direction: layout.direction ?? 'vertical',
      gap: layout.gap ?? 4,
      padding: layout.padding ?? 0,
      paddingTop: layout.paddingTop ?? layout.padding ?? this._def.paddingTop,
      paddingBottom: layout.paddingBottom ?? layout.padding ?? this._def.paddingBottom,
      paddingLeft: layout.paddingLeft ?? layout.padding ?? this._def.paddingLeft,
      paddingRight: layout.paddingRight ?? layout.padding ?? this._def.paddingRight,
      alignment: layout.alignment ?? 'start',
      crossStretch: layout.crossStretch ?? false,
    };
    this._dirty = true;
  }

  update(): void {
    if (this._dirty) this._arrange();
  }

  get children(): readonly PIXI.Container[] {
    return this.stage.children;
  }

  get nodeCount(): number {
    return this._nodes.length;
  }

  private _arrange(): void {
    this._dirty = false;
    const def = this._def;
    const isVertical = def.direction === 'vertical';
    const nodes = this._nodes;

    if (nodes.length === 0) return;

    const pt = def.paddingTop;
    const pb = def.paddingBottom;
    const pl = def.paddingLeft;
    const pr = def.paddingRight;

    if (isVertical) {
      const contentW = Math.max(0, this.stage.width - pl - pr);
      let cursorY = pt;

      for (const node of nodes) {
        const ch = node.height ?? node.container.height;
        const cw = node.width ?? node.container.width;
        node.container.y = cursorY;

        if (def.crossStretch || def.alignment === 'stretch') {
          node.container.x = pl;
          node.container.width = contentW;
        } else if (def.alignment === 'center') {
          node.container.x = pl + (contentW - cw) / 2;
        } else if (def.alignment === 'end') {
          node.container.x = pl + contentW - cw;
        } else {
          node.container.x = pl;
        }

        cursorY += ch + def.gap;
      }
    } else {
      const contentH = Math.max(0, this.stage.height - pt - pb);
      let cursorX = pl;

      for (const node of nodes) {
        const cw = node.width ?? node.container.width;
        const ch = node.height ?? node.container.height;
        node.container.x = cursorX;

        if (def.crossStretch || def.alignment === 'stretch') {
          node.container.y = pt;
          node.container.height = contentH;
        } else if (def.alignment === 'center') {
          node.container.y = pt + (contentH - ch) / 2;
        } else if (def.alignment === 'end') {
          node.container.y = pt + contentH - ch;
        } else {
          node.container.y = pt;
        }

        cursorX += cw + def.gap;
      }
    }
  }

  destroy(): void {
    this.stage.onRender = undefined;
    this._nodes = [];
    this.stage.destroy({ children: true });
  }
}
