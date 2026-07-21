/**
 * VnScriptPlayer — 读 VnScriptJSON 中间格式，驱动 AvdController + KagLayerManager
 *
 * 工作方式：
 *   1. 接收 VnScriptJSON
 *   2. 将 ops 转换为 AvdLine[]（给 AvdController）
 *   3. 处理图层操作（给 KagLayerManager）
 *   4. 处理控制流（label/jump/call/return/if）
 *   5. 处理音频
 *
 * 这是一个高层调度器，位于 AvdController + KagLayerManager 之上。
 */
import { gsap } from 'gsap';
import type { VnScriptJSON, VnOp, VnOpDialog, VnOpChoice, VnOpIf, VnOpBgm, VnOpSfx, VnOpVoice, VnOpBg } from './VnTypes';
import { KagLayerManager } from './KagLayerManager';
import type { IRenderLayer, IRenderContainer } from '../render/types';
import type { AvdLine } from '../types';

export interface VnPlayerHost {
  setScript(lines: AvdLine[]): void;
  next(): void;
  getState(): string;
  getLineIndex(): number;
  getLineCount(): number;
  goTo(index: number): void;
  fadeOut(duration?: number, onComplete?: () => void): void;
  fadeIn(duration?: number, onComplete?: () => void): void;
  setFlag(name: string): void;
  clearFlag(name: string): void;
  hasFlag(name: string): boolean;
}

export class VnScriptPlayer {
  private _ops: VnOp[] = [];
  private _cursor = 0;
  private _host: VnPlayerHost;
  private _layerMgr: KagLayerManager;
  private _labelMap: Map<string, number> = new Map();
  private _variables: Record<string, number | string | boolean> = {};
  private _callStack: number[] = [];
  private _avdLines: AvdLine[] = [];
  private _currentDialog: VnOpDialog | null = null;
  private _currentChoices: VnOpChoice[] = [];
  private _pendingAudio: VnOpBgm | VnOpSfx | VnOpVoice | null = null;
  private _pendingBg: VnOpBg | null = null;
  private _paused = false;

  constructor(host: VnPlayerHost, layer: IRenderLayer, parent: IRenderContainer) {
    this._host = host;
    this._layerMgr = new KagLayerManager(parent, layer);
  }

  get layerManager(): KagLayerManager { return this._layerMgr; }

  load(script: VnScriptJSON): void {
    this._ops = script.ops;
    this._cursor = 0;
    this._labelMap.clear();
    this._callStack = [];
    this._avdLines = [];
    this._currentDialog = null;
    this._currentChoices = [];
    this._pendingAudio = null;
    this._pendingBg = null;

    for (let i = 0; i < this._ops.length; i++) {
      if (this._ops[i].type === 'label') {
        this._labelMap.set((this._ops[i] as any).name, i);
      }
    }

    this._build();
  }

  jumpTo(label: string): boolean {
    const idx = this._labelMap.get(label);
    if (idx == null) return false;
    this._flush();
    this._cursor = idx;
    this._build();
    return true;
  }

  destroy(): void {
    this._layerMgr.destroy();
    this._ops = [];
    this._avdLines = [];
    this._labelMap.clear();
  }

  get ops(): readonly VnOp[] { return this._ops; }
  get cursor(): number { return this._cursor; }

  // ── 内部 ──

  private _build(): void {
    this._avdLines = [];
    this._currentDialog = null;
    this._currentChoices = [];
    this._processOps();
    this._flush();
    this._host.setScript(this._avdLines);
  }

  private _processOps(customOps?: VnOp[], startCursor?: number): void {
    const ops = customOps ?? this._ops;
    let i = startCursor ?? 0;
    const max = customOps ? ops.length : this._ops.length;

    const next = (): VnOp | null => {
      if (i >= max) return null;
      return ops[i];
    };

    const advance = (): void => { i++; };
    const cursor = (): number => i;

    while (i < max) {
      const op = customOps ? ops[i] : this._ops[i];
      if (!customOps) this._cursor = i + 1;
      i++;

      switch (op.type) {
        case 'dialog':
          this._currentDialog = op;
          break;

        case 'bg':
          this._flush();
          this._layerMgr.setImage(4, undefined, {
            left: 0, top: 0,
            time: op.duration ?? 500,
          });
          break;

        case 'char':
          this._flush();
          this._layerMgr.setImage(op.layer ?? 2, undefined, {
            left: op.left, top: op.top,
            opacity: op.opacity,
          });
          break;

        case 'moveLayer':
          this._layerMgr.move(op.layer, { left: op.left, top: op.top, opacity: op.opacity, scale: op.scale, time: op.duration });
          break;

        case 'hideLayer':
          this._layerMgr.hide(op.layer, op.duration);
          break;

        case 'voice':
        case 'sfx':
        case 'bgm':
          break;

        case 'wait':
          if (op.duration > 0) {
            this._paused = true;
            gsap.delayedCall(op.duration / 1000, () => { this._paused = false; });
          }
          break;

        case 'choice':
          this._currentChoices.push(op);
          break;

        case 'label':
          break;

        case 'jump': {
          const idx = this._labelMap.get(op.target);
          if (idx != null && !customOps) { this._flush(); this._cursor = idx; this._processOps(); return; }
          break;
        }

        case 'call': {
          const idx = this._labelMap.get(op.target);
          if (idx != null && !customOps) { this._callStack.push(this._cursor); this._cursor = idx; this._processOps(); return; }
          break;
        }

        case 'return': {
          const ret = this._callStack.pop();
          if (ret != null) { this._cursor = ret; return; }
          break;
        }

        case 'end':
          this._flush();
          this._avdLines.push({ text: '…', end: true } as any);
          break;

        case 'if':
          this._flush();
          if (this._evalCond(op.condition)) {
            this._processOps(op.then);
          } else {
            let handled = false;
            if (op.elseIf) {
              for (const elif of op.elseIf) {
                if (this._evalCond(elif.condition)) {
                  this._processOps(elif.body);
                  handled = true;
                  break;
                }
              }
            }
            if (!handled && op.else) {
              this._processOps(op.else);
            }
          }
          break;

        case 'setFlag':
          this._host.setFlag(op.name);
          break;

        case 'clearFlag':
          this._host.clearFlag(op.name);
          break;

        case 'setVar':
          this._variables[op.name] = op.value;
          break;

        case 'eval':
          this._evalSet(op.expr);
          break;

        case 'shake':
          break;

        case 'flash':
          break;

        case 'fadeTo':
          this._flush();
          this._host.fadeOut(op.duration);
          break;

        case 'fadeFrom':
          this._flush();
          this._host.fadeIn(op.duration);
          break;

        case 'comment':
        case 'raw':
        case 'macro':
        case 'endmacro':
        case 'expand':
          break;
      }
    }
  }

  private _flush(): void {
    if (this._currentDialog || this._currentChoices.length > 0) {
      const line: any = {};
      if (this._currentDialog) {
        line.text = this._currentDialog.text;
        line.speaker = this._currentDialog.speaker;
        if (this._currentDialog.bg) line.bgKey = this._currentDialog.bg;
        if (this._currentDialog.voice) line.voiceKey = this._currentDialog.voice;
      }
      if (this._currentChoices.length > 0) {
        line.choices = this._currentChoices.map((c) => ({
          text: c.text,
          targetSegment: c.jump,
        }));
      }
      this._avdLines.push(line);
    }
    this._currentDialog = null;
    this._currentChoices = [];
  }

  private _evalCond(exp: string): boolean {
    if (!exp) return true;
    try {
      const re = /^[fF]\.(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/;
      const m = exp.match(re);
      if (m) {
        const val = this._variables[m[1]];
        const rhs = this._parseVal(m[3]);
        switch (m[2]) {
          case '==': return val === rhs;
          case '!=': return val !== rhs;
          case '>=': return (val as number) >= (rhs as number);
          case '<=': return (val as number) <= (rhs as number);
          case '>': return (val as number) > (rhs as number);
          case '<': return (val as number) < (rhs as number);
        }
      }
      const flagRe = /^[fF]\.(\w+)$/;
      const flagM = exp.match(flagRe);
      if (flagM) return this._host.hasFlag(flagM[1]);
      return false;
    } catch { return false; }
  }

  private _evalSet(expr: string): void {
    const m = expr.match(/^([fF]\.(\w+))\s*=\s*(.+)$/);
    if (m) this._variables[m[2]] = this._parseVal(m[3]);
  }

  private _parseVal(s: string): number | string | boolean {
    const t = s.trim();
    if (t === 'true') return true;
    if (t === 'false') return false;
    const n = Number(t);
    if (!isNaN(n) && t !== '') return n;
    return t.replace(/^['"]|['"]$/g, '');
  }
}
