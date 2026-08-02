/**
 * VnAdapter — VnScriptJSON ↔ AvdLine[] 双向转换桥接
 *
 * 职责：
 *   1. 将 VnScriptJSON 转换为可被 AvdController 消费的 AvdLine[]
 *   2. 无需创建完整 VnScriptPlayer 实例即可完成转换
 *
 * 用法（轻量转换，无 Player 运行时）：
 *   const lines = vnScriptToAvdLines(script);
 *   controller.setScript(lines);
 *
 * 用法（完整播放，含 Player 层管理）：
 *   const runner = new VnScriptRunner(host, layer, parent);
 *   runner.load(script);
 */
import type { VnScriptJSON, VnOp, VnOpDialog, VnOpChoice } from './VnTypes';
import type { AvdLine } from '../types';

// ── 轻量转换（纯函数，无 VnScriptPlayer 依赖）──

/** 将单个 Op 中的音频字段映射到 AvdLine */
function pickAudio(op: VnOp): { bgmKey?: string; sfxKey?: string; voiceKey?: string } {
  if (op.type === 'bgm') return { bgmKey: (op as any).key };
  if (op.type === 'sfx') return { sfxKey: (op as any).key };
  if (op.type === 'voice') return { voiceKey: (op as any).key };
  return {};
}

/** 将 Vn 文本段转换为 AVD 文本段（结构兼容，字段名不同） */
function mapTextSegments(segments: import('./VnTypes').VnTextSegment[]): import('../types').AvdTextSegment[] {
  return segments.map((s) => {
    if (s.kind === 'image') {
      return { kind: 'image', texture: s.textureKey ?? '', width: s.width, height: s.height };
    }
    return { kind: 'text', text: s.text ?? '' };
  });
}

/** 将 VnScriptJSON 直接转换为 AvdLine[] */
export function vnScriptToAvdLines(script: VnScriptJSON): AvdLine[] {
  const lines: AvdLine[] = [];
  let currentDialog: VnOpDialog | null = null;
  let currentChoices: VnOpChoice[] = [];
  let currentAudio: { bgmKey?: string; sfxKey?: string; voiceKey?: string } = {};
  let pendingBg: string | undefined;

  function flush(): void {
    if (currentDialog || currentChoices.length > 0) {
      const line: AvdLine = {
        text: typeof currentDialog?.text === 'string'
          ? currentDialog.text
          : mapTextSegments(currentDialog?.text ?? []),
        speaker: currentDialog?.speaker,
        bgKey: pendingBg ?? currentDialog?.bg,
        ...currentAudio,
        choices: currentChoices.length > 0
          ? currentChoices.map(c => ({
              text: c.text,
              targetSegment: c.jump,
            }))
          : undefined,
      };
      lines.push(line);
    }
    currentDialog = null;
    currentChoices = [];
    currentAudio = {};
    pendingBg = undefined;
  }

  for (const op of script.ops) {
    switch (op.type) {
      case 'dialog':
        flush();
        currentDialog = op;
        break;
      case 'choice':
        currentChoices.push(op);
        break;
      case 'bg':
        pendingBg = (op as any).key;
        break;
      case 'bgm':
      case 'sfx':
      case 'voice':
        currentAudio = { ...currentAudio, ...pickAudio(op) };
        break;
      case 'end':
        flush();
        lines.push({ text: '…', end: true } as AvdLine);
        break;
      default:
        flush();
        break;
    }
  }

  flush();
  return lines;
}

// ── 完整播放（包装 VnScriptPlayer）──

import { VnScriptPlayer, type VnPlayerHost } from './VnScriptPlayer';
import type { IRenderLayer, IRenderContainer } from '@framework/render/types';
import type { AnimationDriver } from '@framework/animation/types';

/** VnPlayerHost 的最小实现，用于 VnScriptRunner */
class _Host implements VnPlayerHost {
  private _script: AvdLine[] = [];
  private _state = 'idle';
  private _index = 0;

  onSetScript?: (lines: AvdLine[]) => void;
  onNext?: () => void;
  onFadeOut?: (duration?: number, onComplete?: () => void) => void;
  onFadeIn?: (duration?: number, onComplete?: () => void) => void;

  setScript(lines: AvdLine[]): void { this._script = lines; this._state = 'ready'; this.onSetScript?.(lines); }
  next(): void { this.onNext?.(); }
  getState(): string { return this._state; }
  getLineIndex(): number { return this._index; }
  getLineCount(): number { return this._script.length; }
  goTo(index: number): void { this._index = index; }
  fadeOut(duration?: number, onComplete?: () => void): void { this.onFadeOut?.(duration, onComplete); }
  fadeIn(duration?: number, onComplete?: () => void): void { this.onFadeIn?.(duration, onComplete); }

  private _flags = new Set<string>();
  setFlag(name: string): void { this._flags.add(name); }
  clearFlag(name: string): void { this._flags.delete(name); }
  hasFlag(name: string): boolean { return this._flags.has(name); }
}

/**
 * VnScriptRunner — 将 VnScriptJSON 转换为 AvdLine[] 并通过回调输出
 *
 * 用法：
 *   const runner = new VnScriptRunner(host, layer, parent);
 *   runner.onScript = (lines) => controller.setScript(lines);
 *   runner.load(script);
 */
export class VnScriptRunner {
  private _player: VnScriptPlayer;
  private _host: _Host;

  constructor(layer: IRenderLayer, parent: IRenderContainer, driver?: AnimationDriver) {
    this._host = new _Host();
    this._player = new VnScriptPlayer(this._host, layer, parent, driver);
  }

  get player(): VnScriptPlayer { return this._player; }

  /** 当 VnScriptPlayer 输出 AvdLine[] 时触发 */
  onScript: ((lines: AvdLine[]) => void) | null = null;

  load(script: VnScriptJSON): void {
    this._host.onSetScript = (lines) => this.onScript?.(lines);
    this._player.load(script);
  }

  jumpTo(label: string): boolean {
    return this._player.jumpTo(label);
  }

  destroy(): void {
    this._player.destroy();
  }
}
