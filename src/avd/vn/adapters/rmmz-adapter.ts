/**
 * RMMZ (RPG Maker MZ) → VnScriptJSON 适配器
 *
 * 输入：RMMZ 事件命令数组（Map.json 中的 pages[].list）
 * 输出：VnScriptJSON
 *
 * 支持命令：
 *   101 — 对话（Show Text）
 *   401 — 对话续行
 *   102 — 选项（Show Choices）
 *   402 — 选项分支
 *   403 — 选项取消
 *   404 — 选项结束
 *   111 — 条件分支（if）
 *   411 — else
 *   412 — 分支结束
 *   118 — 标签
 *   119 — 跳转
 *   121 — 开关操作
 *   122 — 变量操作
 *   241 — 播放 BGM
 *   250 — 播放 SE
 *   231 — 显示图片
 *   232 — 移动图片
 *   233 — 旋转图片
 *   234 — 淡出图片
 *   355 — 脚本
 *   108/408 — 注释
 *   205 — 设置移动路线
 *   212 — 显示动画
 *   301 — 战斗处理
 *   351 — 菜单画面
 */
import type { VnScriptJSON, VnOp, VnOpDialog, VnOpChoice, VnOpIf } from '../VnTypes';

interface RmmzEventCommand {
  code: number;
  indent: number;
  parameters: any[];
}

export function rmmzToVnScript(list: RmmzEventCommand[]): VnScriptJSON {
  const ops: VnOp[] = [];
  const ifStack: Array<{ then: VnOp[]; else: VnOp[]; current: VnOp[]; seenElse: boolean }> = [];
  let i = 0;

  function target(): VnOp[] {
    return ifStack.length > 0 ? ifStack[ifStack.length - 1].current : ops;
  }

  function pushOp(op: VnOp): void { target().push(op); }

  while (i < list.length) {
    const cmd = list[i];
    const code = cmd.code;
    const p = cmd.parameters;
    const indent = cmd.indent;

    switch (code) {
      case 0: break; // 空

      case 101: { // 对话开始
        const speaker = p[0] ?? '';  // faceName
        const text = p[3] ?? [];     // messageText (array of strings)
        const fullText = text.join('\n').replace(/\\n/g, '\n');
        pushOp({ type: 'dialog', text: fullText || '…' });
        break;
      }
      case 401: break; // 对话续行（已包含在 101 中）
      case 108: case 408: break; // 注释

      case 102: { // 显示选项
        const choicesRaw: string[] = p[0] ?? [];
        const branches: number[] = p[1] ?? [];
        const choices: VnOpChoice[] = choicesRaw
          .filter((c: string) => c)
          .map((text: string, idx: number) => {
            // 查找选项跳转
            let targetLabel = '';
            for (let j = i + 1; j < list.length; j++) {
              if (list[j].code === 402 && (list[j].parameters[0] === idx || list[j].parameters[0] === text)) {
                targetLabel = `choice_${idx}`;
                break;
              }
              if (list[j].code === 404 || list[j].code === 0) break;
            }
            return { type: 'choice' as const, text, jump: targetLabel || undefined };
          });
        pushOp(choices[0]);
        for (let ci = 1; ci < choices.length; ci++) pushOp(choices[ci]);
        break;
      }
      case 402: // 选项分支
      case 403: // 取消分支
      case 404: break; // 分支结束

      case 111: { // 条件分支
        const cond = formatRmmzCondition(p);
        const ifOp: VnOpIf = { type: 'if', condition: cond, then: [] };
        pushOp(ifOp);
        ifStack.push({ then: ifOp.then, else: [], current: ifOp.then, seenElse: false });
        break;
      }
      case 411: { // else
        if (ifStack.length > 0) {
          const frame = ifStack[ifStack.length - 1];
          frame.current = frame.else;
          frame.seenElse = true;
        }
        break;
      }
      case 412: { // 分支结束
        if (ifStack.length > 0) {
          const frame = ifStack.pop()!;
          const last = ops[ops.length - 1];
          if (last && last.type === 'if' && last.then === frame.then) {
            if (frame.else.length > 0) (last as any).else = frame.else;
          }
        }
        break;
      }

      case 118: { // 标签
        pushOp({ type: 'label', name: p[0] ?? '' });
        break;
      }
      case 119: { // 跳转
        pushOp({ type: 'jump', target: p[0] ?? '' });
        break;
      }
      case 121: { // 开关操作
        const flagName = `switch_${p[0]}`;
        if (p[1] === 0) pushOp({ type: 'setFlag', name: flagName });
        else pushOp({ type: 'clearFlag', name: flagName });
        break;
      }
      case 122: { // 变量操作
        const varName = `var_${p[0]}`;
        const val = p[4] ?? 0;
        pushOp({ type: 'setVar', name: varName, value: val });
        break;
      }
      case 241: { // 播放 BGM
        const bgm = p[0] ?? {};
        pushOp({ type: 'bgm', file: bgm.name ?? '', loop: true });
        break;
      }
      case 250: { // 播放 SE
        const se = p[0] ?? {};
        pushOp({ type: 'sfx', file: se.name ?? '' });
        break;
      }
      case 231: { // 显示图片
        pushOp({ type: 'raw', content: `[ShowPicture ${p[0] ?? ''}]` });
        break;
      }
      case 232: { // 移动图片
        pushOp({ type: 'raw', content: `[MovePicture ${p[0] ?? ''}]` });
        break;
      }
      case 233: break; // 旋转图片
      case 234: break; // 淡出图片

      case 355: { // 脚本
        pushOp({ type: 'eval', expr: (p[0] ?? '').toString() });
        break;
      }
      case 205: break; // 设置移动路线
      case 212: break; // 显示动画
      case 301: case 351: break; // 战斗/菜单
      default: {
        pushOp({ type: 'raw', content: `[code ${code}]` });
      }
    }
    i++;
  }

  return { version: 1, ops };
}

function formatRmmzCondition(p: any[]): string {
  const condType = p[0];
  switch (condType) {
    case 0: return `f.switch_${p[1]} == ${p[2]}`;
    case 1: return `f.var_${p[1]} ${cmpOp(p[2])} ${p[3]}`;
    case 2: return `f.self_switch_${p[1]}`;
    case 4: return `f.party_has_${p[1]}`;
    case 6: return `f.gold >= ${p[1]}`;
    case 7: return `f.item_${p[1]} >= ${p[2]}`;
    case 8: return `f.weapon_${p[1]} >= ${p[2]}`;
    case 11: return `f.timer >= 0`;
    default: return `cond_${condType}`;
  }
}

function cmpOp(v: number): string {
  return ['==', '>=', '<=', '>', '<', '!='][v] ?? '==';
}
