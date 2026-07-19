import * as PIXI from 'pixi.js';
import { gsap } from './gsap-pixi';

export type TextEffectType = 'typewriter' | 'fadeInChars' | 'fadeIn' | 'slideIn' | 'scaleBounce' | 'charRain' | 'scramble';

export interface TextEffectOptions {
  x?: number;
  y?: number;
  maxWidth?: number;
  speed?: number;
  duration?: number;
  lineHeight?: number;
}

export interface TextEffectHandle {
  readonly container: PIXI.Container;
  readonly completed: boolean;
  skip(): void;
  destroy(): void;
}

export type TextSegment =
  | { kind: 'text'; text: string }
  | { kind: 'image'; texture: PIXI.Texture; width?: number; height?: number };

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

interface LayoutItem {
  kind: 'text' | 'image';
  textObj?: PIXI.Text;
  textContent?: string;
  sprite?: PIXI.Sprite;
  startUnit: number;
  endUnit: number;
  width: number;
  height: number;
}

interface LayoutResult {
  container: PIXI.Container;
  items: LayoutItem[];
  totalUnits: number;
}

function isCJKChar(c: string): boolean {
  if (c.length === 0) return false;
  const code = c.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0x30a0 && code <= 0x30ff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xf900 && code <= 0xfaff)
  );
}

interface TextBreak {
  start: number;
  end: number;
}

function computeBreakPoints(text: string): TextBreak[] {
  if (text.length === 0) return [];
  const breaks: TextBreak[] = [];
  let bufStart = 0;
  for (let i = 0; i < text.length; i++) {
    if (i === 0) continue;
    const c = text[i];
    const prev = text[i - 1];
    const isSpace = c === ' ' || c === '\t';
    const prevIsSpace = prev === ' ' || prev === '\t';
    if (isSpace !== prevIsSpace) {
      breaks.push({ start: bufStart, end: i });
      bufStart = i;
    } else if (isCJKChar(c) !== isCJKChar(prev) && !isSpace) {
      breaks.push({ start: bufStart, end: i });
      bufStart = i;
    }
  }
  breaks.push({ start: bufStart, end: text.length });
  return breaks;
}

function buildLayout(segments: TextSegment[], style: PIXI.TextStyle, maxWidth: number, lineHeight: number): LayoutResult {
  const flatItems: LayoutItem[] = [];
  let unit = 0;

  for (const seg of segments) {
    if (seg.kind === 'text') {
      if (seg.text.length === 0) continue;
      const breaks = computeBreakPoints(seg.text);
      for (const bp of breaks) {
        const piece = seg.text.slice(bp.start, bp.end);
        if (piece.length === 0) continue;
        const t = new PIXI.Text({ text: piece, style });
        flatItems.push({
          kind: 'text',
          textObj: t,
          textContent: piece,
          startUnit: unit,
          endUnit: unit + piece.length,
          width: t.width,
          height: t.height,
        });
        unit += piece.length;
      }
    } else {
      const w = seg.width ?? seg.texture.width;
      const h = seg.height ?? seg.texture.height;
      const s = new PIXI.Sprite(seg.texture);
      s.width = w;
      s.height = h;
      flatItems.push({
        kind: 'image',
        sprite: s,
        startUnit: unit,
        endUnit: unit,
        width: w,
        height: h,
      });
    }
  }

  const rows: LayoutItem[][] = [];
  let currentRow: LayoutItem[] = [];
  let currentRowWidth = 0;

  for (const item of flatItems) {
    if (currentRowWidth + item.width > maxWidth && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
    currentRow.push(item);
    currentRowWidth += item.width;
  }
  if (currentRow.length > 0) rows.push(currentRow);

  const container = new PIXI.Container();
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const rowMaxH = Math.max(...row.map((it) => it.height));
    const rowY = ri * lineHeight;
    let x = 0;
    for (const item of row) {
      const iy = rowY + (rowMaxH - item.height) / 2;
      if (item.textObj) {
        item.textObj.x = x;
        item.textObj.y = iy;
        container.addChild(item.textObj);
      }
      if (item.sprite) {
        item.sprite.x = x;
        item.sprite.y = iy;
        container.addChild(item.sprite);
      }
      x += item.width;
    }
  }

  return { container, items: flatItems, totalUnits: unit };
}

function measureCharWidth(ch: string, style: PIXI.TextStyle): number {
  const t = new PIXI.Text({ text: ch, style });
  const w = t.width;
  t.destroy(true);
  return w || 10;
}

function splitIntoLines(text: string, charWidths: number[], maxWidth: number): { lines: string[]; lineWidths: number[] } {
  const chars = Array.from(text);
  let currentLine = '';
  let currentW = 0;
  const lines: string[] = [];
  const lineWidths: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    const cw = charWidths[i] || 10;
    if (chars[i] === '\n') {
      lines.push(currentLine);
      lineWidths.push(currentW);
      currentLine = '';
      currentW = 0;
      continue;
    }
    if (currentW + cw > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      lineWidths.push(currentW);
      currentLine = '';
      currentW = 0;
    }
    currentLine += chars[i];
    currentW += cw;
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
    lineWidths.push(currentW);
  }
  return { lines, lineWidths };
}

export function runTextEffect(
  parent: PIXI.Container,
  text: string | TextSegment[],
  textStyle: PIXI.TextStyle,
  type: TextEffectType,
  opts: TextEffectOptions = {},
): TextEffectHandle {
  const {
    x = 0,
    y = 0,
    maxWidth = Infinity,
    speed = 30,
    duration = 1,
    lineHeight = (typeof textStyle.fontSize === 'number' ? textStyle.fontSize : 18) + 6,
  } = opts;

  const container = new PIXI.Container();
  container.eventMode = 'none';
  container.x = x;
  container.y = y;
  parent.addChild(container);

  let completed = false;
  let tweens: gsap.core.Tween[] = [];
  let timeline: gsap.core.Timeline | null = null;

  function setCompleted() {
    completed = true;
  }

  function killAll() {
    if (timeline) {
      timeline.kill();
      timeline = null;
    }
    for (const t of tweens) {
      t.kill();
    }
    tweens = [];
  }

  const isSegments = Array.isArray(text);
  const segments: TextSegment[] = isSegments ? text : [{ kind: 'text', text: text as string }];

  const chars = Array.from(isSegments ? (text as TextSegment[]).map(s => s.kind === 'text' ? s.text : '').join('') : (text as string));

  let layout: LayoutResult | null = null;
  let singleText: PIXI.Text | null = null;
  let charTexts: PIXI.Text[] = [];

  if (isSegments || type === 'typewriter' || type === 'charRain' || type === 'scramble') {
    layout = buildLayout(segments, textStyle, maxWidth, lineHeight);
    container.addChild(layout.container);
  } else {
    const t = new PIXI.Text({
      text: isSegments ? '' : text as string,
      style: { ...textStyle, wordWrap: maxWidth < Infinity, wordWrapWidth: maxWidth },
    });
    t.eventMode = 'none';
    container.addChild(t);
    singleText = t;
  }

  switch (type) {
    case 'typewriter': {
      if (!layout) break;

      for (const item of layout.items) {
        if (item.textObj) item.textObj.visible = false;
        if (item.sprite) item.sprite.visible = false;
      }

      const units = layout.totalUnits;
      let revealed = 0;
      const step = Math.max(1, speed);

      if (units === 0) {
        setCompleted();
        break;
      }

      timeline = gsap.timeline({
        onComplete: setCompleted,
      });

      const timePerChar = 1 / step;
      const totalTime = units * timePerChar;

      const revealAt = (pos: number) => {
        const shown = Math.min(units, Math.floor(pos));
        for (const item of layout!.items) {
          if (item.kind === 'text' && item.textObj && item.textContent) {
            const local = Math.max(0, Math.min(shown, item.endUnit) - item.startUnit);
            if (local <= 0) {
              item.textObj.visible = false;
            } else if (local >= item.textContent.length) {
              item.textObj.visible = true;
              item.textObj.text = item.textContent;
            } else {
              item.textObj.visible = true;
              item.textObj.text = Array.from(item.textContent).slice(0, local).join('');
            }
          } else if (item.kind === 'image' && item.sprite) {
            item.sprite.visible = shown >= item.startUnit;
          }
        }
      };

      for (let i = 0; i <= units; i++) {
        const t = i * timePerChar;
        timeline!.call(() => revealAt(i), undefined, t);
      }
      timeline!.call(setCompleted, undefined, totalTime);
      break;
    }

    case 'fadeInChars': {
      if (layout) {
        const fadeItems: (PIXI.Text | PIXI.Sprite)[] = [];
        for (const item of layout.items) {
          if (item.textObj) fadeItems.push(item.textObj);
          if (item.sprite) fadeItems.push(item.sprite);
        }
        for (const fi of fadeItems) fi.alpha = 0;

        let totalDone = 0;
        for (let i = 0; i < fadeItems.length; i++) {
          const t = gsap.to(fadeItems[i], {
            alpha: 1,
            duration: Math.min(duration, 0.4),
            delay: i * (Math.min(duration, 0.4) / Math.max(fadeItems.length, 1)),
            ease: 'power2.out',
            onComplete: () => {
              totalDone++;
              if (totalDone >= fadeItems.length) setCompleted();
            },
          });
          tweens.push(t);
        }
      } else if (singleText) {
        singleText.alpha = 0;
        singleText.visible = false;
        const t = gsap.to(singleText, {
          alpha: 1,
          duration,
          ease: 'power2.out',
          onComplete: setCompleted,
          onStart: () => { singleText!.visible = true; },
        });
        tweens.push(t);
      }
      break;
    }

    case 'fadeIn': {
      if (layout) {
        layout.container.alpha = 0;
        const t = gsap.to(layout.container, {
          alpha: 1,
          duration,
          ease: 'power2.out',
          onComplete: setCompleted,
        });
        tweens.push(t);
      } else if (singleText) {
        singleText.alpha = 0;
        const t = gsap.to(singleText, {
          alpha: 1,
          duration,
          ease: 'power2.out',
          onComplete: setCompleted,
        });
        tweens.push(t);
      }
      break;
    }

    case 'slideIn': {
      const tw = layout ? (layout.container.width || 200) : (singleText?.width || 200);
      const startX = -tw - 50;
      if (layout) {
        layout.container.x = startX;
        const t = gsap.to(layout.container, {
          x: 0,
          duration,
          ease: 'power3.out',
          onComplete: setCompleted,
        });
        tweens.push(t);
      } else if (singleText) {
        singleText.x = startX;
        const t = gsap.to(singleText, {
          x: 0,
          duration,
          ease: 'power3.out',
          onComplete: setCompleted,
        });
        tweens.push(t);
      }
      break;
    }

    case 'scaleBounce': {
      if (layout) {
        layout.container.scale.set(0);
        const t = gsap.to(layout.container.scale, {
          x: 1,
          y: 1,
          duration,
          ease: 'back.out(3)',
          onComplete: setCompleted,
        });
        tweens.push(t);
      } else if (singleText) {
        singleText.scale.set(0);
        const t = gsap.to(singleText.scale, {
          x: 1,
          y: 1,
          duration,
          ease: 'back.out(3)',
          onComplete: setCompleted,
        });
        tweens.push(t);
      }
      break;
    }

    case 'charRain': {
      if (!layout) break;

      const rainItems: { obj: PIXI.Text | PIXI.Sprite; targetY: number }[] = [];

      for (const item of layout.items) {
        const targetY = item.textObj?.y ?? item.sprite?.y ?? 0;
        if (item.textObj) {
          item.textObj.y = -20 - Math.random() * 100;
          item.textObj.alpha = 0;
          rainItems.push({ obj: item.textObj, targetY });
        }
        if (item.sprite) {
          item.sprite.y = -20 - Math.random() * 100;
          item.sprite.alpha = 0;
          rainItems.push({ obj: item.sprite, targetY });
        }
      }

      for (let i = 0; i < rainItems.length; i++) {
        const { obj, targetY } = rainItems[i];
        const t = gsap.to(obj, {
          y: targetY,
          alpha: 1,
          duration: 0.5 + Math.random() * 0.4,
          delay: i * 0.04,
          ease: 'bounce.out',
          onComplete: i === rainItems.length - 1 ? setCompleted : undefined,
        });
        tweens.push(t);
      }
      break;
    }

    case 'scramble': {
      if (!layout) break;

      const scrambleText = layout.items
        .filter((it) => it.kind === 'text' && it.textObj && it.textContent)
        .map((it) => ({ obj: it.textObj!, text: it.textContent! }));

      if (scrambleText.length === 0) { setCompleted(); break; }

      const allText = scrambleText.map((st) => st.text).join('');
      const fullChars = Array.from(allText);
      const current: string[] = new Array(fullChars.length).fill('');
      let globalPos = 0;

      const charToItem: { itemIdx: number; localIdx: number }[] = [];
      for (const st of scrambleText) {
        for (let ci = 0; ci < Array.from(st.text).length; ci++) {
          charToItem.push({ itemIdx: scrambleText.indexOf(st), localIdx: ci });
        }
      }

      for (const st of scrambleText) st.obj.visible = true;

      timeline = gsap.timeline({
        onComplete: setCompleted,
      });

      for (let i = 0; i < fullChars.length; i++) {
        const scrambleCount = 2 + Math.floor(Math.random() * 3);
        for (let s = 0; s < scrambleCount; s++) {
          const sc = CHARSET[Math.floor(Math.random() * CHARSET.length)];
          timeline!.call(() => {
            current[globalPos] = sc;
            let ci = 0;
            for (const st of scrambleText) {
              const len = Array.from(st.text).length;
              st.obj.text = current.slice(ci, ci + len).join('');
              ci += len;
            }
          }, undefined, i * 0.08 + s * 0.03);
        }
        timeline!.call(() => {
          current[globalPos] = fullChars[globalPos];
          let ci = 0;
          for (const st of scrambleText) {
            const len = Array.from(st.text).length;
            st.obj.text = current.slice(ci, ci + len).join('');
            ci += len;
          }
          globalPos++;
        }, undefined, i * 0.08 + scrambleCount * 0.03);
      }

      const finalDelay = chars.length * 0.08 + 3 * 0.03;
      timeline!.call(setCompleted, undefined, finalDelay);

      if (layout.items.some((it) => it.kind === 'image')) {
        for (const item of layout.items) {
          if (item.kind === 'image' && item.sprite) {
            timeline!.call(() => { item.sprite!.visible = true; }, undefined, finalDelay);
          }
        }
      }

      for (const item of layout.items) {
        if (item.sprite) item.sprite.visible = false;
      }
      break;
    }
  }

  function skip() {
    if (completed) return;
    killAll();
    switch (type) {
      case 'typewriter':
        if (layout) {
          for (const item of layout.items) {
            if (item.textObj && item.textContent) {
              item.textObj.visible = true;
              item.textObj.text = item.textContent;
            }
            if (item.sprite) item.sprite.visible = true;
          }
        }
        break;
      case 'fadeInChars':
        if (layout) {
          for (const item of layout.items) {
            if (item.textObj) item.textObj.alpha = 1;
            if (item.sprite) item.sprite.alpha = 1;
          }
        }
        break;
      case 'fadeIn':
        if (layout) layout.container.alpha = 1;
        else if (singleText) singleText.alpha = 1;
        break;
      case 'slideIn':
        if (layout) layout.container.x = 0;
        else if (singleText) singleText.x = 0;
        break;
      case 'scaleBounce':
        if (layout) layout.container.scale.set(1);
        else if (singleText) singleText.scale.set(1);
        break;
      case 'charRain':
        if (layout) {
          for (const item of layout.items) {
            if (item.textObj) { item.textObj.alpha = 1; item.textObj.y = item.textObj.y; }
            if (item.sprite) { item.sprite.alpha = 1; item.sprite.y = item.sprite.y; }
          }
        }
        break;
      case 'scramble':
        if (layout) {
          for (const item of layout.items) {
            if (item.textObj && item.textContent) {
              item.textObj.visible = true;
              item.textObj.text = item.textContent;
            }
            if (item.sprite) item.sprite.visible = true;
          }
        }
        break;
    }
    setCompleted();
  }

  return {
    get container() { return container; },
    get completed() { return completed; },
    skip,
    destroy: () => {
      killAll();
      container.removeFromParent();
      container.destroy({ children: true });
    },
  };
}
