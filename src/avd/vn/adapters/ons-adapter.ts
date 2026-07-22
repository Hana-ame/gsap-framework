/**
 * ONS → VnScriptJSON 适配器
 *
 * ONS 是 ONScripter/NScripter 的脚本格式（日语同人游戏通用）。
 *
 * 支持语法：
 *   *label         — 标签定义
 *   @tag           — 行前命令
 *   "text"         — 对话文本
 *   ;comment       — 注释
 *
 * 支持命令：
 *   bg "file",method,time
 *   image "file",layer,x,y,alpha,time
 *   wait time
 *   se "file"
 *   bgm "file"
 *   voice "file"
 *   btnwait time
 *   jump target
 *   call target
 *   return
 *   if cond
 *   endif
 *   set layer,alpha
 *   mov layer,x,y,time
 *   ld "file"      — 加载图片到当前层
 *   text "string"  — 设置显示文字
 *   eraset "time"  — 擦除文字
 *   erase "time"   — 擦除图层
 *   select "text",*target
 *   click           — 等待点击
 *   new_wave "file" — 循环音效
 *   play "file"     — 播放视频
 *   stop
 *   end
 */
import type { VnScriptJSON, VnOp, VnOpDialog, VnOpChoice } from '../VnTypes';

export function onsToVnScript(source: string): VnScriptJSON {
  const ops: VnOp[] = [];
  const lines = source.split(/\r?\n/);
  let currentText = '';
  let lastLabel: string | undefined;

  const ifStack: Array<{ then: VnOp[]; else: VnOp[]; current: VnOp[] }> = [];

  function target(): VnOp[] {
    return ifStack.length > 0 ? ifStack[ifStack.length - 1].current : ops;
  }

  function flushText(): void {
    if (!currentText) return;
    target().push({ type: 'dialog', text: currentText });
    currentText = '';
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith(';')) continue;

    if (line.startsWith('*')) {
      flushText();
      lastLabel = line.slice(1);
      ops.push({ type: 'label', name: lastLabel });
      continue;
    }

    if (line.startsWith('"') || line.startsWith("'")) {
      const m = line.match(/^(["'])(.*?)\1/);
      if (m) {
        currentText += (currentText ? '\n' : '') + m[2];
        continue;
      }
    }

    if (line.startsWith('@')) {
      const cmd = line.slice(1).trim();
      const parts = splitParams(cmd);
      const name = parts[0]?.toLowerCase() ?? '';
      const args = parts.slice(1);

      switch (name) {
        case 'bg':
          flushText();
          target().push({
            type: 'bg', image: args[0] ?? '',
            transition: args[1] ?? 'crossfade',
            duration: toNum(args[2], 500),
          });
          break;
        case 'image':
          flushText();
          target().push({
            type: 'char',
            id: args[0]?.replace(/\.\w+$/, '') ?? '',
            image: args[0],
            layer: toNum(args[1], 1),
            left: toOptNum(args[2]), top: toOptNum(args[3]),
            opacity: toOptNum(args[4]),
          });
          break;
        case 'wait':
        case 'btnwait':
          flushText();
          target().push({ type: 'wait', duration: toNum(args[0], 1000) });
          break;
        case 'se':
          target().push({ type: 'sfx', file: args[0] ?? '' });
          break;
        case 'bgm':
          target().push({ type: 'bgm', file: args[0] ?? '' });
          break;
        case 'voice':
          target().push({ type: 'voice', file: args[0] ?? '' });
          break;
        case 'jump':
          flushText();
          target().push({ type: 'jump', target: args[0] ?? '' });
          break;
        case 'call':
          flushText();
          target().push({ type: 'call', target: args[0] ?? '' });
          break;
        case 'return':
          flushText();
          target().push({ type: 'return' });
          break;
        case 'if':
          flushText();
          ifStack.push({ then: [], else: [], current: [] });
          break;
        case 'endif':
          flushText();
          if (ifStack.length > 0) {
            const frame = ifStack.pop()!;
            target().push({ type: 'if', condition: args.join(' '), then: frame.then, else: frame.else.length > 0 ? frame.else : undefined });
          }
          break;
        case 'set':
          flushText();
          target().push({ type: 'moveLayer', layer: toNum(args[0], 1), opacity: toOptNum(args[1]) });
          break;
        case 'mov':
          flushText();
          target().push({ type: 'moveLayer', layer: toNum(args[0], 1), left: toOptNum(args[1]), top: toOptNum(args[2]), duration: toOptNum(args[3]) });
          break;
        case 'ld':
          flushText();
          target().push({ type: 'layer', action: 'set', image: args[0] ?? '', layer: 1 });
          break;
        case 'text':
          currentText += args.join(' ');
          break;
        case 'eraset':
          flushText();
          break;
        case 'erase':
          flushText();
          target().push({ type: 'hideLayer', layer: 1, duration: toOptNum(args[0]) });
          break;
        case 'select':
          flushText();
          target().push({ type: 'choice', text: args[0] ?? '', jump: args[1]?.replace(/^\*/, '') });
          break;
        case 'click':
          flushText();
          break;
        case 'end':
          flushText();
          target().push({ type: 'end' });
          break;
        case 'stop':
          target().push({ type: 'bgm', file: '', loop: false });
          break;
        case 'new_wave':
          target().push({ type: 'sfx', file: args[0] ?? '', loop: true });
          break;
        default:
          target().push({ type: 'raw', content: line });
      }
      continue;
    }

    if (line.startsWith('#')) {
      target().push({ type: 'raw', content: line });
      continue;
    }

    currentText += (currentText ? '\n' : '') + line;
  }

  flushText();
  return { version: 1, ops };
}

function splitParams(cmd: string): string[] {
  const parts: string[] = [];
  const i = cmd.indexOf(' ');
  if (i < 0) { parts.push(cmd); return parts; }
  parts.push(cmd.slice(0, i));
  const rest = cmd.slice(i + 1).trim();

  const re = /(?:"([^"]*)"|'([^']*)'|([^,]+))(?:,|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest)) !== null) {
    const val = m[1] ?? m[2] ?? m[3]?.trim();
    if (val !== undefined && val !== '') parts.push(val);
  }
  return parts;
}

function toNum(v: string | undefined, def = 0): number {
  if (v == null) return def;
  const n = parseInt(v, 10);
  return isNaN(n) ? def : n;
}

function toOptNum(v: string | undefined): number | undefined {
  if (v == null) return undefined;
  const n = parseInt(v, 10);
  return isNaN(n) ? undefined : n;
}
