/**
 * KAG → VnScriptJSON 适配器
 *
 * 输入：KAG 标签脚本字符串
 * 输出：VnScriptJSON（通用中间格式）
 *
 * 支持标签：
 *   [p] [l] [cm] [bg] [image] [trans] [move]
 *   [se] [bgm] [voice] [stopse] [stopbgm]
 *   [jump] [call] [return] [button]
 *   [if] [elseif] [else] [endif]
 *   [eval] [emb] [wt] [wa] [locate] [font] [ruby]
 *   [macro] [endmacro] [iscript] [endscript]
 */
import type { VnScriptJSON, VnOp, VnOpDialog, VnOpChoice, VnOpIf } from '../VnTypes';

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

export function kagToVnScript(source: string): VnScriptJSON {
  const ops: VnOp[] = [];
  const lines = source.split(/\r?\n/);
  const currentTexts: string[] = [];
  let pendingSpeaker: string | undefined;

  // if-block stack: each entry = { ifOp, branch: 'then'|'else'|'elseif' }
  const ifStack: Array<{
    ifOp: VnOpIf;
    branch: 'then' | 'else';
    elseifAccum: Array<{ condition: string; body: VnOp[] }>;
  }> = [];
  let macroAccum: VnOp[] | null = null;
  let macroName = '';

  /** 当前活跃的 ops 列表（考虑 if-block 嵌套） */
  function currentTarget(): VnOp[] {
    if (macroAccum != null) return macroAccum;
    if (ifStack.length > 0) {
      const top = ifStack[ifStack.length - 1];
      if (top.branch === 'else') {
        if (!top.ifOp.else) top.ifOp.else = [];
        return top.ifOp.else;
      }
      return top.ifOp.then;
    }
    return ops;
  }

  function flushText(): void {
    if (currentTexts.length === 0) return;
    const dialog: VnOpDialog = {
      type: 'dialog',
      text: currentTexts.join('\n'),
    };
    if (pendingSpeaker) dialog.speaker = pendingSpeaker;
    currentTarget().push(dialog);
    currentTexts.length = 0;
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith(';')) continue;

    if (line.startsWith('*')) {
      flushText();
      ops.push({ type: 'label', name: line.slice(1).trim() });
      continue;
    }

    if (line.startsWith('[')) {
      const m = line.match(/^\[(\w+)([^\]]*)\]/);
      if (!m) { currentTexts.push(line); continue; }
      const tag = m[1].toLowerCase();
      const attrs = parseAttrs(m[2]);

      switch (tag) {
        case 'p':
          flushText();
          break;
        case 'l':
          currentTexts.push('\n');
          break;
        case 'cm':
          flushText();
          break;
        case 'bg':
          flushText();
          ops.push({
            type: 'bg', image: attrs.storage ?? '',
            transition: attrs.method ?? 'crossfade',
            duration: toNum(attrs.time, 500),
            layer: toNum(attrs.layer),
          });
          break;
        case 'image':
          flushText();
          ops.push({
            type: 'char',
            id: attrs.storage?.replace(/\.\w+$/, '') ?? '',
            image: attrs.storage,
            left: toOptNum(attrs.left),
            top: toOptNum(attrs.top),
            opacity: toOptNum(attrs.opacity),
            layer: toNum(attrs.layer, 1),
          });
          break;
        case 'trans':
          flushText();
          break;
        case 'move':
          ops.push({
            type: 'moveLayer', layer: toNum(attrs.layer, 1),
            left: toOptNum(attrs.left), top: toOptNum(attrs.top),
            opacity: toOptNum(attrs.opacity), scale: toOptNum(attrs.scale),
            duration: toOptNum(attrs.time),
          });
          break;
        case 'se':
          ops.push({ type: 'sfx', file: attrs.storage ?? '', loop: attrs.loop === 'true' });
          break;
        case 'bgm':
          ops.push({ type: 'bgm', file: attrs.storage ?? '', loop: attrs.loop !== 'false', fadeIn: toOptNum(attrs.fadein) });
          break;
        case 'voice':
          ops.push({ type: 'voice', file: attrs.storage ?? '' });
          break;
        case 'stopse':
          ops.push({ type: 'sfx', file: '', loop: false }); break;
        case 'stopbgm':
          ops.push({ type: 'bgm', file: '', loop: false }); break;
        case 'jump':
          flushText();
          ops.push({ type: 'jump', target: attrs.target ?? attrs.storage ?? '' });
          break;
        case 'call':
          flushText();
          ops.push({ type: 'call', target: attrs.target ?? attrs.storage ?? '' });
          break;
        case 'return':
          flushText();
          ops.push({ type: 'return' });
          break;
        case 'button':
          flushText();
          if (ifStack.length > 0 && (ifStack[ifStack.length - 1].branch === 'else' ? (ifStack[ifStack.length - 1].ifOp.else?.length ?? 0) > 0 : ifStack[ifStack.length - 1].ifOp.then.length > 0)) {
            currentTexts.push(`[${attrs.text ?? ''}]`);
            break;
          }
          {
            const choice: VnOpChoice = { type: 'choice', text: attrs.text ?? '', jump: attrs.target };
            if (attrs.condition) choice.condition = `f.${attrs.condition}`;
            currentTarget().push(choice);
          }
          break;
        case 'if':
          flushText();
          {
            const ifOp: VnOpIf = { type: 'if', condition: attrs.exp ?? '', then: [] };
            currentTarget().push(ifOp);
            ifStack.push({ ifOp, branch: 'then', elseifAccum: [] });
          }
          break;
        case 'elseif':
          flushText();
          if (ifStack.length > 0) {
            const top = ifStack[ifStack.length - 1];
            top.branch = 'else';
            top.ifOp.else = [];
            top.elseifAccum.push({ condition: attrs.exp ?? '', body: top.ifOp.else });
          }
          break;
        case 'else':
          flushText();
          if (ifStack.length > 0) {
            const top = ifStack[ifStack.length - 1];
            top.branch = 'else';
            if (!top.ifOp.else) top.ifOp.else = [];
          }
          break;
        case 'endif':
          flushText();
          if (ifStack.length > 0) {
            const top = ifStack.pop()!;
            if (top.elseifAccum.length > 0) {
              top.ifOp.elseIf = top.elseifAccum;
              if (top.ifOp.else?.length === 0) top.ifOp.else = undefined;
            }
          }
          break;
        case 'eval':
          ops.push({ type: 'eval', expr: attrs.exp ?? '' });
          break;
        case 'emb':
          if (currentTexts.length === 0) currentTexts.push('');
          currentTexts[currentTexts.length - 1] += `%emb(${attrs.exp ?? ''})%`;
          break;
        case 'wt':
          ops.push({ type: 'wait', duration: toNum(attrs.time, 1000) });
          break;
        case 'wa':
          ops.push({ type: 'wait', duration: 0 });
          break;
        case 'locate':
          break;
        case 'font':
          break;
        case 'ruby':
          if (currentTexts.length === 0) currentTexts.push('');
          currentTexts[currentTexts.length - 1] += `%ruby(${attrs.text ?? ''},${attrs.ruby ?? ''})%`;
          break;
        case 'macro':
          macroName = attrs.name ?? '';
          macroAccum = [];
          break;
        case 'endmacro':
          if (macroName && macroAccum) {
            ops.push({ type: 'macro', name: macroName, body: macroAccum });
          }
          macroAccum = null;
          macroName = '';
          break;
        case 'iscript':
        case 'endscript':
          break;
        default:
          ops.push({ type: 'raw', content: line });
      }
      continue;
    }

    // 行内 @ 标签
    if (line.includes('@')) {
      let processed = line;
      processed = processed.replace(/@(\w+)((?:[^\\]|\\.)*?)(?=\s*@|\s*$|$)/g, (_m, name, args) => {
        const parsed = parseAttrs(args);
        switch (name) {
          case 'emb':
            return `%emb(${parsed.exp ?? ''})%`;
          case 'ruby':
            return `%ruby(${parsed.text ?? ''},${parsed.ruby ?? ''})%`;
          default:
            return _m;
        }
      });
      currentTexts.push(processed);
    } else {
      currentTexts.push(line);
    }
  }

  flushText();

  return { version: 1, ops };
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
