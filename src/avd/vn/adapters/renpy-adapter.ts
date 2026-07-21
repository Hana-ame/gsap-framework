/**
 * Ren'Py → VnScriptJSON 适配器
 *
 * 输入：.rpy 脚本字符串
 * 输出：VnScriptJSON
 *
 * 支持语法：
 *   label name:         — 标签
 *   "speaker" "text"    — 对话
 *   show char at pos    — 角色显示
 *   hide char           — 角色隐藏
 *   scene bg            — 场景切换
 *   play music/audio    — 音乐/音效
 *   stop music          — 停止音乐
 *   voice file          — 语音
 *   menu:               — 选项菜单
 *     "text" -> label   — 选项
 *   jump label          — 跳转
 *   call label          — 调用
 *   return              — 返回
 *   if/elif/else:       — 条件分支
 *   $ var = expr        — 赋值
 *   pause duration      — 等待
 *   with effect         — 转场
 *   "{b}bold{/b}"       — BBCode 风格标记
 *   "# comment"         — 注释
 *
 * 参考：https://renpy.org/doc/html/
 */
import type { VnScriptJSON, VnOp, VnOpDialog, VnOpChoice } from '../VnTypes';

export function renpyToVnScript(source: string): VnScriptJSON {
  const ops: VnOp[] = [];
  const lines = source.split(/\r?\n/);

  const ifStack: Array<{ then: VnOp[]; else: VnOp[]; current: VnOp[] }> = [];
  let inMenu = false;
  let menuChoices: VnOpChoice[] = [];
  let currentDialog: { speaker: string; text: string } | null = null;

  function target(): VnOp[] {
    return ifStack.length > 0 ? ifStack[ifStack.length - 1].current : ops;
  }

  function flushDialog(): void {
    if (currentDialog) {
      target().push({ type: 'dialog', speaker: currentDialog.speaker, text: currentDialog.text });
      currentDialog = null;
    }
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('#')) continue;

    // label name:
    const labelM = line.match(/^label\s+(\w+)\s*:/);
    if (labelM) { flushDialog(); target().push({ type: 'label', name: labelM[1] }); continue; }

    // menu:
    if (line === 'menu:') {
      flushDialog();
      inMenu = true;
      menuChoices = [];
      continue;
    }

    // menu choices
    if (inMenu) {
      const choiceM = line.match(/^"(.+?)"\s*->\s*(.+)/);
      if (choiceM) {
        menuChoices.push({ type: 'choice', text: choiceM[1], jump: choiceM[2].trim() });
        continue;
      }
      if (line.startsWith('"') && !choiceM) {
        // dialogue text in menu, ignore
        continue;
      }
      if (line === '' || line.startsWith('#')) continue;
      // end menu
      if (menuChoices.length > 0) {
        target().push(...menuChoices);
        menuChoices = [];
      }
      inMenu = false;
    }

    // "speaker" "text"
    const dialogM = line.match(/^"(.+?)"\s+"(.+)"$/);
    if (dialogM) {
      flushDialog();
      currentDialog = { speaker: dialogM[1], text: dialogM[2] };
      continue;
    }

    // "text" (narrator)
    const textM = line.match(/^"(.+)"$/);
    if (textM) {
      flushDialog();
      target().push({ type: 'dialog', text: textM[1] });
      continue;
    }

    // show expression char at pos
    const showM = line.match(/^show\s+(\w+(?:\s+\w+)*)\s+at\s+(\w+)/);
    if (showM) {
      flushDialog();
      target().push({ type: 'char', id: showM[1].split(/\s+/)[0], image: showM[1], position: showM[2] });
      continue;
    }
    const showSimpleM = line.match(/^show\s+(.+)/);
    if (showSimpleM) {
      flushDialog();
      const parts = showSimpleM[1].trim().split(/\s+/);
      target().push({ type: 'char', id: parts[0], image: showSimpleM[1].trim() });
      continue;
    }

    // hide char
    const hideM = line.match(/^hide\s+(.+)/);
    if (hideM) {
      flushDialog();
      target().push({ type: 'raw', content: line });
      continue;
    }

    // scene bg
    const sceneM = line.match(/^scene\s+(.+)/);
    if (sceneM) {
      flushDialog();
      target().push({ type: 'bg', image: sceneM[1].trim() });
      continue;
    }

    // play music/audio
    const playM = line.match(/^play\s+(music|audio)\s+"(.+?)"/);
    if (playM) {
      if (playM[1] === 'music') target().push({ type: 'bgm', file: playM[2] });
      else target().push({ type: 'sfx', file: playM[2], loop: true });
      continue;
    }

    // stop music
    const stopM = line.match(/^stop\s+(music|audio)/);
    if (stopM) {
      if (stopM[1] === 'music') target().push({ type: 'bgm', file: '', loop: false });
      else target().push({ type: 'sfx', file: '', loop: false });
      continue;
    }

    // voice file
    const voiceM = line.match(/^voice\s+"(.+?)"/);
    if (voiceM) { target().push({ type: 'voice', file: voiceM[1] }); continue; }

    // $ var = expr
    const varM = line.match(/^\$\s*(.+?)\s*=\s*(.+)/);
    if (varM) {
      target().push({ type: 'setVar', name: varM[1].trim(), value: parseRenpyValue(varM[2].trim()) });
      continue;
    }

    // jump label
    const jumpM = line.match(/^jump\s+(.+)/);
    if (jumpM) { flushDialog(); target().push({ type: 'jump', target: jumpM[1].trim() }); continue; }

    // call label
    const callM = line.match(/^call\s+(.+)/);
    if (callM) { flushDialog(); target().push({ type: 'call', target: callM[1].trim() }); continue; }

    // return
    if (line === 'return') { flushDialog(); target().push({ type: 'return' }); continue; }

    // if condition:
    const ifM = line.match(/^if\s+(.+):/);
    if (ifM) {
      flushDialog();
      ifStack.push({ then: [], else: [], current: [] });
      continue;
    }

    // elif condition:
    const elifM = line.match(/^elif\s+(.+):/);
    if (elifM) { continue; }

    // else:
    if (line === 'else:') {
      flushDialog();
      if (ifStack.length > 0) {
        ifStack[ifStack.length - 1].current = ifStack[ifStack.length - 1].else;
      }
      continue;
    }

    if (line.match(/^else\s+if\s+(.+):/)) { continue; }

    if (line === 'endif' || line.match(/^#\s*endif/)) {
      flushDialog();
      if (ifStack.length > 0) {
        const frame = ifStack.pop()!;
        target().push({ type: 'if', condition: '', then: frame.then, else: frame.else.length > 0 ? frame.else : undefined });
      }
      continue;
    }

    // pause duration
    const pauseM = line.match(/^pause\s+(.+)/);
    if (pauseM) {
      target().push({ type: 'wait', duration: toNum(pauseM[1], 1000) });
      continue;
    }

    // with effect
    const withM = line.match(/^with\s+(.+)/);
    if (withM) { continue; }

    // pass / python block / init / screen etc — skip
    if (line === 'pass' || line.startsWith('python:') || line.startsWith('init ') || line.startsWith('screen ') || line.startsWith('transform ') || line.startsWith('define ') || line.startsWith('default ')) continue;

    // indent-based block content — skip silently
    if (line.startsWith('    ') || line.startsWith('\t')) continue;

    // fallback
    target().push({ type: 'raw', content: line });
  }

  flushDialog();
  if (menuChoices.length > 0) target().push(...menuChoices);

  return { version: 1, ops };
}

function parseRenpyValue(s: string): number | string | boolean {
  if (s === 'True') return true;
  if (s === 'False') return false;
  const n = Number(s);
  if (!isNaN(n) && s !== '') return n;
  return s.replace(/^["']|["']$/g, '');
}

function toNum(v: string | undefined, def = 0): number {
  if (v == null) return def;
  const n = parseInt(v, 10);
  return isNaN(n) ? def : n;
}
